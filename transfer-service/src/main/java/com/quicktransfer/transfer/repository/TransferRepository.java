package com.quicktransfer.transfer.repository;

import com.quicktransfer.transfer.domain.Transfer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TransferRepository extends JpaRepository<Transfer, Long> {

    Optional<Transfer> findByTransferId(String transferId);

    boolean existsByTransferId(String transferId);

    Page<Transfer> findBySenderAccountOrderByCreatedAtDesc(String senderAccount, Pageable pageable);
}
