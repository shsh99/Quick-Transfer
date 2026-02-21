# Quick Transfer - AI 작업 가이드

## 프로젝트 개요
실시간 금융 송금 MSA 시스템. Kafka Choreography Saga + Kubernetes 학습 목적.
패키지 루트: `com.quicktransfer`

## 기술 스택
Java 21, Spring Boot 3.4, Spring Kafka, Spring Data JPA, MySQL 8, Redis, Docker, Kubernetes, React 18 + TypeScript + Vite, Gradle 멀티모듈

## 서비스 구성

| 서비스 | 포트 | DB | 패키지 |
|--------|------|-----|--------|
| account-service | 8081 | account_db (MySQL :3306) | `com.quicktransfer.account` |
| transfer-service | 8082 | transfer_db (MySQL :3307) | `com.quicktransfer.transfer` |
| notification-service | 8083 | Redis :6379 | `com.quicktransfer.notification` |
| frontend | 3000 | - | React SPA |

DB 공통: user=`qt_user`, password=`qt_password`, Kafka: `localhost:9092`

## API 엔드포인트

### Account Service (`/api/accounts`)
| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/accounts` | 계좌 생성. Body: `{ownerName}` → `ApiResponse<AccountResponse>` |
| GET | `/api/accounts/{accountNumber}` | 계좌 조회 → `ApiResponse<AccountResponse>` |
| GET | `/api/accounts/{accountNumber}/transactions` | 거래 내역 (페이징) → `ApiResponse<Page<TransactionLog>>` |

### Transfer Service (`/api/transfers`)
| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/transfers` | 송금 요청. Body: `{senderAccount, receiverAccount, amount}` → 201 |
| GET | `/api/transfers/{transferId}` | 송금 조회 |
| GET | `/api/transfers?senderAccount=xxx` | 송금 목록 (페이징) |

### Notification Service (`/api/notifications`)
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/notifications/{accountNumber}/subscribe` | SSE 구독 (MediaType: text/event-stream) |

## DB 엔티티

### Account (account_db.accounts)
`id(Long PK)`, `accountNumber(String, unique, 20)`, `ownerName(String, 50)`, `balance(BigDecimal 18,2)`, `status(Enum: ACTIVE/FROZEN/CLOSED)`, `createdAt`, `updatedAt`
도메인 메서드: `debit(amount)`, `credit(amount)` — Setter 금지

### TransactionLog (account_db.transaction_log)
`id(Long PK)`, `accountId(Long)`, `type(Enum: DEBIT/CREDIT/ROLLBACK)`, `amount(BigDecimal)`, `balanceBefore`, `balanceAfter`, `transferId(String, 36)`, `description(String, 500)`, `createdAt`

### Transfer (transfer_db.transfers)
`id(Long PK)`, `transferId(String, unique, 36)`, `senderAccount(String, 20)`, `receiverAccount(String, 20)`, `amount(BigDecimal 18,2)`, `status(Enum: PENDING/DEBITED/SUCCESS/FAILED)`, `failReason(String, 500)`, `createdAt`, `completedAt`
도메인 메서드: `updateStatus(newStatus)`, `fail(reason)` — Setter 금지

## Kafka 이벤트 흐름 (Choreography Saga)

```
송금요청 → Transfer(PENDING) → [transfer-requested]
  → Account 출금(비관적 락) → [debit-completed] → Transfer(DEBITED)
    → Account 입금 → [credit-completed] → Transfer(SUCCESS) → [transfer-completed]
      → Notification SSE push (양쪽 계좌)

실패: [debit-failed] → Transfer(FAILED) → [transfer-failed] → SSE 알림
보상: [credit-failed] → Account 출금 롤백 → Transfer(FAILED) → [transfer-failed] → SSE 알림
```

### Kafka 토픽-서비스 매핑

| 토픽 | Producer | Consumer (group-id) |
|------|----------|---------------------|
| transfer-requested | TransferEventProducer | Account (account-service-group) |
| debit-completed | AccountEventProducer | Transfer (transfer-service-group), Account (account-service-credit-group) |
| debit-failed | AccountEventProducer | Transfer (transfer-service-group) |
| credit-completed | AccountEventProducer | Transfer (transfer-service-group) |
| credit-failed | AccountEventProducer | Transfer (transfer-service-group), Account (account-service-rollback-group) |
| transfer-completed | TransferEventProducer | Notification (notification-service-group) |
| transfer-failed | TransferEventProducer | Notification (notification-service-group) |

### 이벤트 클래스 (common/event/)
모든 이벤트: `@Data @Builder @NoArgsConstructor @AllArgsConstructor`
- `TransferRequestedEvent`: eventType, transferId, senderAccount, receiverAccount, amount, timestamp
- `DebitCompletedEvent`: eventType, transferId, accountNumber, senderAccount, receiverAccount, amount, balanceAfter, timestamp
- `DebitFailedEvent`: eventType, transferId, accountNumber, amount, reason, timestamp
- `CreditCompletedEvent`: eventType, transferId, accountNumber, amount, balanceAfter, timestamp
- `CreditFailedEvent`: eventType, transferId, accountNumber, senderAccount, receiverAccount, amount, reason, timestamp
- `TransferCompletedEvent`: eventType, transferId, senderAccount, receiverAccount, amount, timestamp
- `TransferFailedEvent`: eventType, transferId, senderAccount, receiverAccount, amount, reason, timestamp

### Kafka Consumer Group-ID 규칙
application.yml에는 기본 group-id만 정의. 실제 group-id는 `@KafkaListener(groupId = "xxx")` 어노테이션에 하드코딩.
하나의 서비스가 같은 토픽을 다른 목적으로 소비할 때 group-id를 분리한다 (예: account-service-group, account-service-credit-group, account-service-rollback-group).

## 에러 코드 (common/exception/ErrorCode.java)

| 코드 | 이름 | 메시지 |
|------|------|--------|
| A001 | ACCOUNT_NOT_FOUND | 계좌를 찾을 수 없습니다 |
| A002 | INSUFFICIENT_BALANCE | 잔액이 부족합니다 |
| A003 | ACCOUNT_FROZEN | 동결된 계좌입니다 |
| A004 | DUPLICATE_ACCOUNT | 이미 존재하는 계좌번호입니다 |
| T001 | TRANSFER_NOT_FOUND | 송금 내역을 찾을 수 없습니다 |
| T002 | DUPLICATE_TRANSFER | 중복된 송금 요청입니다 |
| T003 | SAME_ACCOUNT_TRANSFER | 동일 계좌로 송금할 수 없습니다 |
| T004 | INVALID_AMOUNT | 유효하지 않은 금액입니다 |
| C001 | INTERNAL_ERROR | 내부 서버 오류가 발생했습니다 |
| C002 | INVALID_REQUEST | 잘못된 요청입니다 |

## API 응답 포맷 (common/response/ApiResponse.java)
모든 API는 `ApiResponse<T>` 래퍼로 응답. `@JsonInclude(NON_NULL)` 적용.
```json
// 성공
{ "success": true, "data": { ... }, "timestamp": "2025-01-01T00:00:00" }

// 실패
{ "success": false, "error": { "code": "A002", "message": "잔액이 부족합니다" }, "timestamp": "..." }
```
정적 팩토리: `ApiResponse.ok(data)`, `ApiResponse.error(code, message)`

---

## AI 작업 규칙

### 핵심 원칙
- 코드 작성 전 반드시 계획 제시 → 승인 대기 → 순차 작업 → 완료 보고
- 단순 질문/조회/설명은 바로 응답

### 계획 제시 형식
```
## 작업 계획
### 요청 분석
- 요청: [내용] / 범위: [포함] / 비목표: [제외]
### 작업 목록
| # | 작업 | 파일 | 우선순위 |
**이 계획대로 진행할까요?**
```

### MoSCoW 우선순위
Must(필수) / Should(권장) / Could(선택) / Won't(제외)

### 승인 키워드
승인: "ㅇㅇ", "응", "진행해", "ㄱㄱ" / 수정: "X는 빼고"

## 코딩 컨벤션

### 작업 순서
- Backend: Entity → Repository → DTO → Exception → Service → Controller
- Frontend: Types → API Service → Hook/Store → Component → Page

### 필수 규칙
- Entity: Setter 금지 → `updateXxx()` 도메인 메서드 사용
- Repository: 잔액 변경시 `@Lock(PESSIMISTIC_WRITE)` 비관적 락
- Service: 클래스 `@Transactional(readOnly=true)`, 변경 메서드만 `@Transactional`
- Controller: try-catch 금지 → GlobalExceptionHandler 위임
- Kafka Consumer: 멱등성 보장 (`transferId + type`으로 중복 체크)
- 금액: BigDecimal만 사용 (double/float 금지)
- 서비스간 직접 REST 호출 금지 (Kafka로만 통신)
- Frontend: any 금지, `types/api.ts` 타입 사용

### 패키지 구조 (서비스 공통)
```
xxx-service/src/main/java/com/quicktransfer/xxx/
├── XxxServiceApplication.java
├── domain/        # Entity
├── repository/    # JpaRepository
├── service/       # 비즈니스 로직
├── controller/    # REST API
├── consumer/      # Kafka Consumer
├── producer/      # Kafka Producer
└── exception/     # GlobalExceptionHandler
```

### 네이밍 규칙
- 클래스: `XxxService`, `XxxController`, `XxxRepository`, `XxxEventConsumer`, `XxxEventProducer`
- Kafka 토픽: `kebab-case` (transfer-requested, debit-completed)
- API 경로: `/api/{서비스명}s` (accounts, transfers, notifications)

## 실행 방법
```bash
# 인프라만 (로컬 개발)
docker-compose up mysql-account mysql-transfer redis zookeeper kafka -d

# 서비스 (터미널 3개)
./gradlew :account-service:bootRun
./gradlew :transfer-service:bootRun
./gradlew :notification-service:bootRun

# 프론트엔드
cd frontend && npm run dev

# 전체 Docker
docker-compose up --build
```

## 참고 문서
- `docs/project-structure.md` — 프로젝트 구조 상세 설명
- `docs/mcdonalds-principle.md` — 맥도날드 원칙 상세
