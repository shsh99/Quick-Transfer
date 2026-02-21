package com.quicktransfer.transfer.service;

import com.quicktransfer.common.event.TransferRequestedEvent;
import com.quicktransfer.common.exception.BusinessException;
import com.quicktransfer.common.exception.ErrorCode;
import com.quicktransfer.transfer.domain.Transfer;
import com.quicktransfer.transfer.domain.Transfer.TransferStatus;
import com.quicktransfer.transfer.producer.TransferEventProducer;
import com.quicktransfer.transfer.repository.TransferRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransferService {

    private final TransferRepository transferRepository;
    private final TransferEventProducer eventProducer;

    @Transactional
    public Transfer createTransfer(String senderAccount, String receiverAccount, BigDecimal amount) {
        if (senderAccount.equals(receiverAccount)) {
            throw new BusinessException(ErrorCode.SAME_ACCOUNT_TRANSFER);
        }
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(ErrorCode.INVALID_AMOUNT);
        }

        String transferId = UUID.randomUUID().toString();

        Transfer transfer = Transfer.builder()
                .transferId(transferId)
                .senderAccount(senderAccount)
                .receiverAccount(receiverAccount)
                .amount(amount)
                .status(TransferStatus.PENDING)
                .build();

        transferRepository.save(transfer);

        eventProducer.sendTransferRequested(TransferRequestedEvent.builder()
                .eventType("TRANSFER_REQUESTED")
                .transferId(transferId)
                .senderAccount(senderAccount)
                .receiverAccount(receiverAccount)
                .amount(amount)
                .timestamp(LocalDateTime.now())
                .build());

        log.info("송금 요청 생성: transferId={}, {}→{}, {}원",
                transferId, senderAccount, receiverAccount, amount);
        return transfer;
    }

    @Transactional(readOnly = true)
    public Transfer getTransfer(String transferId) {
        return transferRepository.findByTransferId(transferId)
                .orElseThrow(() -> new BusinessException(ErrorCode.TRANSFER_NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public Page<Transfer> getTransfers(String senderAccount, Pageable pageable) {
        return transferRepository.findBySenderAccountOrderByCreatedAtDesc(senderAccount, pageable);
    }

    @Transactional
    public void updateStatus(String transferId, TransferStatus status) {
        Transfer transfer = getTransfer(transferId);
        transfer.updateStatus(status);
        log.info("송금 상태 변경: transferId={}, status={}", transferId, status);
    }

    @Transactional
    public void failTransfer(String transferId, String reason) {
        Transfer transfer = getTransfer(transferId);
        transfer.fail(reason);
        log.info("송금 실패: transferId={}, reason={}", transferId, reason);
    }
}
