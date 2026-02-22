package com.quicktransfer.transfer.repository;

import com.quicktransfer.transfer.domain.Transfer;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface TransferRepository extends JpaRepository<Transfer, Long> {

    Optional<Transfer> findByTransferId(String transferId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM Transfer t WHERE t.transferId = :transferId")
    Optional<Transfer> findByTransferIdForUpdate(@Param("transferId") String transferId);

    boolean existsByTransferId(String transferId);

    Page<Transfer> findBySenderAccountOrderByCreatedAtDesc(String senderAccount, Pageable pageable);
}
