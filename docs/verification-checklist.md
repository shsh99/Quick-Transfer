# Verification Checklist

## 목적
문서/기능 변경 이후 핵심 흐름이 유지되는지 빠르게 검증하기 위한 체크리스트.

## 1. 자동 테스트
- `./gradlew test`
- 기대 결과: 모든 모듈 테스트 통과

## 2. 계좌 API
1. `POST /api/accounts`로 계좌 생성
2. `GET /api/accounts`로 목록 조회
3. `GET /api/accounts/{accountNumber}`로 단건 조회
4. `GET /api/accounts/{accountNumber}/transactions` 초기 빈 페이지 확인

## 3. 송금 Saga API
1. 서로 다른 2개 계좌 준비
2. `POST /api/transfers` 요청
3. `GET /api/transfers/{transferId}` 상태가 `PENDING -> DEBITED -> SUCCESS`로 바뀌는지 확인
4. `GET /api/transfers?senderAccount=...` 목록 정렬/페이징 확인

## 4. 실패/보상 흐름
1. 잔액 부족 금액으로 송금 요청
2. `GET /api/transfers/{transferId}` 상태가 `FAILED`인지 확인
3. 송금자 거래내역에서 `ROLLBACK` 로그 생성 여부 확인(입금 실패 시나리오 포함)

## 5. Notification 멀티 인스턴스
1. notification-service를 2개 이상 인스턴스로 실행
2. 동일 계좌로 SSE 구독 연결
3. 송금 성공/실패 이벤트 발생
4. 구독이 어느 인스턴스에 연결되었는지와 관계없이 알림 수신 확인

## 6. 응답 포맷
- 성공: `ApiResponse.ok(data)` 구조(`success=true`, `data`, `timestamp`)
- 실패: `ApiResponse.error(code, message)` 구조(`success=false`, `error`, `timestamp`)
- Validation 실패 시 `C002` 확인
