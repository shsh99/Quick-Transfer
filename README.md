# Quick Transfer

토스/카카오페이의 축소 버전 **실시간 송금 시스템**입니다.
Kafka, MSA(마이크로서비스), Kubernetes를 직접 체험하기 위한 학습 프로젝트입니다.

## 아키텍처

```
[Frontend]  ──HTTP──>  [Transfer Service]  ──Kafka──>  [Account Service]
   React+TS              송금 생성/상태관리              출금/입금/롤백
   :3000                 :8082 (transfer_db)            :8081 (account_db)
                              │                              │
                              └─── Kafka ───> [Notification Service]
                                               SSE 실시간 알림
                                               :8083 (Redis)
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
| Redis | SSE 연결 관리 |
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
| Account | GET | `/api/accounts/{accountNumber}` | 계좌 조회 |
| Account | GET | `/api/accounts/{accountNumber}/transactions` | 거래 내역 |
| Transfer | POST | `/api/transfers` | 송금 요청 |
| Transfer | GET | `/api/transfers/{transferId}` | 송금 조회 |
| Transfer | GET | `/api/transfers?senderAccount=xxx` | 송금 목록 |
| Notification | GET | `/api/notifications/{accountNumber}/subscribe` | SSE 알림 구독 |

## 문서

- [CLAUDE.md](CLAUDE.md) - AI 작업 가이드
- [docs/project-structure.md](docs/project-structure.md) - 프로젝트 구조 상세 설명
- [docs/mcdonalds-principle.md](docs/mcdonalds-principle.md) - 맥도날드 원칙 (AI 시대 개발 매뉴얼)
