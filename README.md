# Quick Transfer

토스/카카오페이의 축소 버전 **실시간 송금 시스템**입니다.
Kafka, MSA(마이크로서비스), Kubernetes를 직접 체험하기 위한 학습 프로젝트입니다.

## 스크린샷

### 정상 송금 흐름

<div align="center">

| 홈 (내 자산) | 송금 처리중 | 송금 완료 | 실시간 알림 |
|:---:|:---:|:---:|:---:|
| <img src="https://github.com/user-attachments/assets/f29d367b-6b96-4534-8357-52922b6876c8" width="200" /> | <img src="https://github.com/user-attachments/assets/83d1eebd-0e54-433b-a536-820780c7e402" width="200" /> | <img src="https://github.com/user-attachments/assets/2a8caf82-64e0-4665-915f-52db06fad029" width="200" /> | <img src="https://github.com/user-attachments/assets/cea5087c-7de6-4ca8-9992-4d38aec5e0d8" width="200" /> |
| 계좌 목록 및 총 자산 조회 | Saga 패턴 진행 상태 | 출금→입금 완료 (1초 이내) | SSE 기반 실시간 알림 |

</div>

### 실패 및 보상 트랜잭션

<div align="center">

| 송금 실패 (잔액 부족) | 실패 알림 |
|:---:|:---:|
| <img src="https://github.com/user-attachments/assets/211b8189-ed5f-4cb8-aad2-c205fa49534c" width="200" /> | <img src="https://github.com/user-attachments/assets/163ba658-9161-4305-97b4-0992c73f6170" width="200" /> |
| 잔액 부족 시 Saga 보상 트랜잭션 처리 | 실패 사유와 함께 실시간 알림 전달 |

</div>

## 아키텍처

```
[Frontend]  ──HTTP──>  [Transfer Service]  ──Kafka──>  [Account Service]
   React+TS              송금 생성/상태관리              출금/입금/롤백
   :3000                 :8082 (transfer_db)            :8081 (account_db)
                              │                              │
                              └─── Kafka ───> [Notification Service]
                                               SSE 실시간 알림
                                               :8083 (Redis Pub/Sub)
```

**핵심 패턴**: Choreography Saga - 서비스 간 직접 호출 없이 Kafka 이벤트로만 통신

```
송금 요청 → 출금(비관적 락) → 입금 → 완료 알림
실패 시 → 보상 트랜잭션(출금 롤백) → 실패 알림
```

## 기술 스택

| 기술 | 역할 |
|------|------|
| Java 21 + Spring Boot 3.4 | 백엔드 서비스 |
| Apache Kafka | 서비스 간 비동기 메시징 (Saga) |
| MySQL 8 | 서비스별 독립 DB |
| Redis | Notification fan-out (Pub/Sub) + SSE 확장 |
| React 18 + TypeScript + Vite | 프론트엔드 SPA |
| Docker + Kubernetes | 컨테이너 배포 + HPA 자동 스케일링 |
| Prometheus + Grafana | 모니터링 |
| k6 | 부하 테스트 (동시 1,000건 송금) |

## 빠른 시작

### 1. 인프라 실행

```bash
docker-compose up mysql-account mysql-transfer redis zookeeper kafka -d
```

### 2. 백엔드 서비스 실행 (터미널 3개)

```bash
./gradlew :account-service:bootRun
./gradlew :transfer-service:bootRun
./gradlew :notification-service:bootRun
```

### 3. 프론트엔드 실행

```bash
cd frontend && npm install && npm run dev
```

### 전체 Docker Compose (한 번에 실행)

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

## 프로젝트 구조

```
quick-transfer/
├── common/                  공유 모듈 (이벤트 DTO, 예외, 응답)
├── account-service/         계좌 서비스 (:8081)
├── transfer-service/        송금 서비스 (:8082)
├── notification-service/    알림 서비스 (:8083)
├── frontend/                React SPA (:3000)
├── k8s/                     Kubernetes 매니페스트
├── k6/                      부하 테스트 스크립트
├── docs/                    프로젝트 문서
└── docker-compose.yml       로컬 통합 실행
```

## API 엔드포인트

| 서비스 | Method | Path | 설명 |
|--------|--------|------|------|
| Account | POST | `/api/accounts` | 계좌 생성 |
| Account | GET | `/api/accounts` | 계좌 목록 조회 |
| Account | GET | `/api/accounts/{accountNumber}` | 계좌 조회 |
| Account | GET | `/api/accounts/{accountNumber}/transactions` | 거래 내역 |
| Transfer | POST | `/api/transfers` | 송금 요청 |
| Transfer | GET | `/api/transfers/{transferId}` | 송금 조회 |
| Transfer | GET | `/api/transfers?senderAccount=xxx` | 송금 목록 |
| Notification | GET | `/api/notifications/{accountNumber}/subscribe` | SSE 알림 구독 |

## 변경 사항 메모

- 요청 DTO에 Bean Validation이 적용되어 잘못된 요청은 `C002` 에러로 반환됩니다.
- 거래내역 응답은 엔티티 대신 DTO로 반환됩니다.
- Notification 서비스는 Redis Pub/Sub으로 멀티 인스턴스 SSE 알림 fan-out을 보장합니다.

## 문서

- [AGENTS.md](AGENTS.md) - AI 작업 가이드
- [docs/project-structure.md](docs/project-structure.md) - 프로젝트 구조 상세 설명
- [docs/mcdonalds-principle.md](docs/mcdonalds-principle.md) - 맥도날드 원칙 (AI 시대 개발 매뉴얼)
- [docs/db-migrations.md](docs/db-migrations.md) - DB 마이그레이션 가이드
- [docs/verification-checklist.md](docs/verification-checklist.md) - 기능 검증 체크리스트

## 맥도날드 원칙 요약

- PRD 작성 후 AI 리뷰로 기존 기능 재사용 여부, 수정 범위, 신규 개발 필요를 점검한다.
- 업무 요청은 PRD 7단계 산출물을 프롬프트 폴더에 정리한 뒤 진행한다.
- 디자인/기획 검증은 AI 가상 FGI 시뮬레이션과 PRD·CS 데이터 축적으로 보완한다.
