# DB 마이그레이션 가이드

## 목적
아래 변경사항을 기존 DB에 반영합니다.
- 거래내역 멱등성 강화를 위한 유니크 제약 추가
- 송금/거래내역 조회 인덱스 추가

## 사전 점검 (중복 데이터 확인)

### account_db.transaction_log 중복 체크
```sql
SELECT transfer_id, type, COUNT(*) AS cnt
FROM transaction_log
WHERE transfer_id IS NOT NULL
GROUP BY transfer_id, type
HAVING cnt > 1;
```

중복이 있다면 제거 후 진행하세요.

## 마이그레이션 SQL

### account_db
```sql
USE account_db;

ALTER TABLE transaction_log
  ADD UNIQUE KEY uk_transaction_log_transfer_type (transfer_id, type),
  ADD INDEX idx_transaction_log_account_created (account_id, created_at);
```

### transfer_db
```sql
USE transfer_db;

ALTER TABLE transfers
  ADD INDEX idx_transfer_sender_created (sender_account, created_at);
```

## 검증 쿼리

### account_db
```sql
SHOW INDEX FROM transaction_log;
```

### transfer_db
```sql
SHOW INDEX FROM transfers;
```
