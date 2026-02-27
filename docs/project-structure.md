# Quick Transfer - 프로젝트 구조 설명

## 프로젝트가 뭔가요?

토스/카카오페이의 축소 버전 **실시간 송금 시스템**입니다.
학습 목적: Kafka, MSA(마이크로서비스), Kubernetes를 직접 체험하기 위한 프로젝트.

---

## 전체 구조

```
quick-transfer/
│
├── common/                    [공유 라이브러리]
│   └── src/main/java/com/quicktransfer/common/
│       ├── event/             Kafka 이벤트 DTO 7종
│       ├── exception/         에러 코드 + 비즈니스 예외
│       └── response/          API 응답 래퍼 (ApiResponse)
│
├── account-service/           [계좌 서비스] 포트 8081, DB: account_db
│   └── src/main/java/com/quicktransfer/account/
│       ├── domain/            Account, TransactionLog 엔티티
│       ├── repository/        JPA Repository (비관적 락 포함)
│       ├── service/           계좌 생성, 출금, 입금, 롤백
│       ├── controller/        REST API 3개
│       ├── consumer/          Kafka: transfer-requested, debit-completed, credit-failed 수신
│       ├── producer/          Kafka: debit-completed/failed, credit-completed/failed 발행
│       └── exception/         GlobalExceptionHandler
│
├── transfer-service/          [송금 서비스] 포트 8082, DB: transfer_db
│   └── src/main/java/com/quicktransfer/transfer/
│       ├── domain/            Transfer 엔티티 (상태: PENDING→DEBITED→SUCCESS/FAILED)
│       ├── repository/        JPA Repository
│       ├── service/           송금 생성, 상태 변경
│       ├── controller/        REST API 3개
│       ├── consumer/          Kafka: debit-completed/failed, credit-completed/failed 수신
│       ├── producer/          Kafka: transfer-requested, transfer-completed/failed 발행
│       └── exception/         GlobalExceptionHandler
│
├── notification-service/      [알림 서비스] 포트 8083, Redis
│   └── src/main/java/com/quicktransfer/notification/
│       ├── service/           SseEmitterService (SSE 연결 관리)
│       ├── controller/        SSE 구독 엔드포인트 1개
│       └── consumer/          Kafka: transfer-completed/failed → SSE push
│
├── frontend/                  [React 프론트엔드] 포트 3000
│   └── src/
│       ├── api/               백엔드 API 호출 (axios)
│       ├── pages/             대시보드, 송금, 송금상세, 알림
│       ├── components/        공통 UI (Navbar)
│       ├── types/             TypeScript 타입 정의
│       ├── hooks/             커스텀 React Hooks (확장용)
│       ├── store/             상태 관리 (확장용)
│       └── utils/             유틸리티 함수 (확장용)
│
├── k8s/                       [쿠버네티스 배포 설정]
│   ├── namespace.yaml         네임스페이스 정의
│   ├── configmap.yaml         환경 설정 (DB URL, Kafka 주소)
│   ├── secret.yaml            비밀 정보 (DB 비밀번호)
│   ├── mysql/                 MySQL StatefulSet 2개
│   ├── kafka/                 Zookeeper + Kafka + Redis
│   ├── services/              서비스 Deployment + HPA + Ingress
│   └── monitoring/            Prometheus + Grafana
│
├── k6/                        [부하 테스트]
│   └── transfer-load-test.js  동시 1000건 송금 시나리오
│
├── docs/                      [문서]
│   ├── mcdonalds-principle.md 맥도날드 원칙 설명
│   ├── db-migrations.md       DB 마이그레이션 가이드
│   └── project-structure.md   이 문서
│
├── docker-compose.yml         로컬 인프라 + 서비스 통합 실행
├── build.gradle               루트 빌드 설정
├── settings.gradle            모듈 정의
└── AGENTS.md                  AI 작업 가이드
```

---

## 서비스간 통신 방식

서비스끼리 **직접 HTTP 호출하지 않습니다**. 모든 통신은 Kafka 이벤트로 합니다.

### 송금 성공 흐름
```
[사용자] → POST /api/transfers
              │
        [Transfer Service]
        Transfer 생성 (PENDING)
        Kafka 발행: transfer-requested
              │
              ▼
        [Account Service]  ← transfer-requested 수신
        출금 계좌에서 차감 (비관적 락)
        Kafka 발행: debit-completed
              │
              ▼
        [Transfer Service]  ← debit-completed 수신
        상태 변경: PENDING → DEBITED
              │
        [Account Service]  ← debit-completed 수신 (credit-group)
        입금 계좌에 추가
        Kafka 발행: credit-completed
              │
              ▼
        [Transfer Service]  ← credit-completed 수신
        상태 변경: DEBITED → SUCCESS
        Kafka 발행: transfer-completed
              │
              ▼
        [Notification Service]  ← transfer-completed 수신
        양쪽 계좌에 SSE 실시간 알림
```

### 실패 + 보상(롤백) 흐름
```
출금 실패:
  Account Service → debit-failed 발행
  Transfer Service → 상태: FAILED, transfer-failed 발행
  Notification Service → 실패 알림

입금 실패 (출금은 성공했으나 입금에서 실패):
  Account Service → credit-failed 발행
  Account Service ← credit-failed 수신 → 출금 계좌에 금액 복원 (롤백)
  Transfer Service → 상태: FAILED, transfer-failed 발행
  Notification Service → 실패 알림
```

---

## 기술 스택과 선택 이유

| 기술 | 역할 | 왜 이걸 선택했나 |
|------|------|-------------------|
| Spring Boot 3.4 | 서버 프레임워크 | Java 21 지원, 학습 자료 풍부 |
| MySQL 8 | 데이터 저장 | 서비스별 독립 DB (Database per Service 패턴) |
| Kafka | 서비스간 비동기 메시지 | Choreography Saga 패턴 구현 |
| Redis | SSE 연결 관리 | Notification Service에서 인메모리 매핑 |
| Docker | 컨테이너 패키징 | 로컬 환경 통일 |
| Kubernetes | 컨테이너 오케스트레이션 | HPA 자동 스케일링 학습 |
| Prometheus + Grafana | 모니터링 | Actuator 메트릭 수집 + 시각화 |
| k6 | 부하 테스트 | 동시 1000건 송금 스파이크 테스트 |

---

## 실행 방법

### 로컬 개발 (인프라만 Docker, 서비스는 직접 실행)
```bash
# 1. 인프라 실행 (MySQL 2개, Kafka, Zookeeper, Redis)
docker-compose up mysql-account mysql-transfer redis zookeeper kafka -d

# 2. 각 서비스 실행 (터미널 3개)
./gradlew :account-service:bootRun
./gradlew :transfer-service:bootRun
./gradlew :notification-service:bootRun

# 3. 프론트엔드 실행
cd frontend && npm run dev
```

### 전체 Docker Compose
```bash
docker-compose up --build
```

### Kubernetes 배포
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secret.yaml -f k8s/configmap.yaml
kubectl apply -f k8s/mysql/ -f k8s/kafka/
kubectl apply -f k8s/services/
kubectl apply -f k8s/monitoring/
```
