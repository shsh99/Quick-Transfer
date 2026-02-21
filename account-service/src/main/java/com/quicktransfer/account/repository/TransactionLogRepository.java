package com.quicktransfer.account.repository;

import com.quicktransfer.account.domain.TransactionLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransactionLogRepository extends JpaRepository<TransactionLog, Long> {

    Page<TransactionLog> findByAccountIdOrderByCreatedAtDesc(Long accountId, Pageable pageable);

    boolean existsByTransferId(String transferId);

    boolean existsByTransferIdAndType(String transferId, TransactionLog.TransactionType type);
}
