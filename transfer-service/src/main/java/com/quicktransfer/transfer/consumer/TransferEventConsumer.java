package com.quicktransfer.transfer.consumer;

import com.quicktransfer.common.event.*;
import com.quicktransfer.transfer.domain.Transfer;
import com.quicktransfer.transfer.domain.Transfer.TransferStatus;
import com.quicktransfer.transfer.repository.TransferRepository;
import com.quicktransfer.transfer.producer.TransferEventProducer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class TransferEventConsumer {

    private final TransferRepository transferRepository;
    private final TransferEventProducer eventProducer;

    @KafkaListener(topics = "debit-completed", groupId = "transfer-service-group")
    @Transactional
    public void handleDebitCompleted(DebitCompletedEvent event) {
        withTransferId(event.getTransferId(), () -> {
            log.info("출금 완료 수신: transferId={}", event.getTransferId());
            transferRepository.findByTransferIdForUpdate(event.getTransferId()).ifPresent(transfer -> {
                if (!transfer.canTransitionTo(TransferStatus.DEBITED)) {
                    log.info("이미 처리된 이벤트 (현재 상태={}): transferId={}", transfer.getStatus(), event.getTransferId());
                    return;
                }
                transfer.updateStatus(TransferStatus.DEBITED);
            });
        });
    }

    @KafkaListener(topics = "debit-failed", groupId = "transfer-service-group")
    @Transactional
    public void handleDebitFailed(DebitFailedEvent event) {
        withTransferId(event.getTransferId(), () -> {
            log.info("출금 실패 수신: transferId={}, reason={}", event.getTransferId(), event.getReason());
            transferRepository.findByTransferIdForUpdate(event.getTransferId()).ifPresent(transfer -> {
                if (!transfer.canTransitionTo(TransferStatus.FAILED)) {
                    log.info("이미 처리된 이벤트 (현재 상태={}): transferId={}", transfer.getStatus(), event.getTransferId());
                    return;
                }
                transfer.fail(event.getReason());

                eventProducer.sendTransferFailed(TransferFailedEvent.builder()
                        .eventType("TRANSFER_FAILED")
                        .transferId(event.getTransferId())
                        .senderAccount(transfer.getSenderAccount())
                        .receiverAccount(transfer.getReceiverAccount())
                        .amount(transfer.getAmount())
                        .reason(event.getReason())
                        .timestamp(LocalDateTime.now())
                        .build());
            });
        });
    }

    @KafkaListener(topics = "credit-completed", groupId = "transfer-service-group")
    @Transactional
    public void handleCreditCompleted(CreditCompletedEvent event) {
        withTransferId(event.getTransferId(), () -> {
            log.info("입금 완료 수신: transferId={}", event.getTransferId());
            transferRepository.findByTransferIdForUpdate(event.getTransferId()).ifPresent(transfer -> {
                if (!transfer.canTransitionTo(TransferStatus.SUCCESS)) {
                    log.info("이미 처리된 이벤트 (현재 상태={}): transferId={}", transfer.getStatus(), event.getTransferId());
                    return;
                }
                transfer.updateStatus(TransferStatus.SUCCESS);

                eventProducer.sendTransferCompleted(TransferCompletedEvent.builder()
                        .eventType("TRANSFER_COMPLETED")
                        .transferId(event.getTransferId())
                        .senderAccount(transfer.getSenderAccount())
                        .receiverAccount(transfer.getReceiverAccount())
                        .amount(transfer.getAmount())
                        .timestamp(LocalDateTime.now())
                        .build());
            });
        });
    }

    @KafkaListener(topics = "credit-failed", groupId = "transfer-service-group")
    @Transactional
    public void handleCreditFailed(CreditFailedEvent event) {
        withTransferId(event.getTransferId(), () -> {
            log.info("입금 실패 수신: transferId={}, reason={}", event.getTransferId(), event.getReason());
            transferRepository.findByTransferIdForUpdate(event.getTransferId()).ifPresent(transfer -> {
                if (!transfer.canTransitionTo(TransferStatus.FAILED)) {
                    log.info("이미 처리된 이벤트 (현재 상태={}): transferId={}", transfer.getStatus(), event.getTransferId());
                    return;
                }
                transfer.fail("입금 실패: " + event.getReason());

                eventProducer.sendTransferFailed(TransferFailedEvent.builder()
                        .eventType("TRANSFER_FAILED")
                        .transferId(event.getTransferId())
                        .senderAccount(transfer.getSenderAccount())
                        .receiverAccount(transfer.getReceiverAccount())
                        .amount(transfer.getAmount())
                        .reason("입금 실패: " + event.getReason())
                        .timestamp(LocalDateTime.now())
                        .build());
            });
        });
    }

    private void withTransferId(String transferId, Runnable action) {
        MDC.put("transferId", transferId);
        try {
            action.run();
        } finally {
            MDC.remove("transferId");
        }
    }
}
