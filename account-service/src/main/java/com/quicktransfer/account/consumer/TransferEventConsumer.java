package com.quicktransfer.account.consumer;

import com.quicktransfer.account.domain.Account;
import com.quicktransfer.account.producer.AccountEventProducer;
import com.quicktransfer.account.repository.AccountRepository;
import com.quicktransfer.account.service.AccountService;
import com.quicktransfer.common.event.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class TransferEventConsumer {

    private final AccountService accountService;
    private final AccountRepository accountRepository;
    private final AccountEventProducer eventProducer;

    @KafkaListener(topics = "transfer-requested", groupId = "account-service-group")
    public void handleTransferRequested(TransferRequestedEvent event) {
        withTransferId(event.getTransferId(), () -> {
            log.info("Transfer requested: transferId={}, senderAccount={}",
                    event.getTransferId(), event.getSenderAccount());
            try {
                accountService.debit(event.getSenderAccount(), event.getAmount(), event.getTransferId());

                Account account = accountRepository.findByAccountNumber(event.getSenderAccount()).orElseThrow();
                eventProducer.sendDebitCompleted(DebitCompletedEvent.builder()
                        .eventType("DEBIT_COMPLETED")
                        .transferId(event.getTransferId())
                        .accountNumber(event.getSenderAccount())
                        .senderAccount(event.getSenderAccount())
                        .receiverAccount(event.getReceiverAccount())
                        .amount(event.getAmount())
                        .balanceAfter(account.getBalance())
                        .timestamp(LocalDateTime.now())
                        .build());
            } catch (Exception e) {
                log.error("Debit failed: transferId={}, reason={}", event.getTransferId(), e.getMessage());
                eventProducer.sendDebitFailed(DebitFailedEvent.builder()
                        .eventType("DEBIT_FAILED")
                        .transferId(event.getTransferId())
                        .accountNumber(event.getSenderAccount())
                        .amount(event.getAmount())
                        .reason(e.getMessage())
                        .timestamp(LocalDateTime.now())
                        .build());
            }
        });
    }

    @KafkaListener(topics = "debit-completed", groupId = "account-service-credit-group")
    public void handleDebitCompleted(DebitCompletedEvent event) {
        withTransferId(event.getTransferId(), () -> {
            log.info("Debit completed: transferId={}, receiverAccount={}",
                    event.getTransferId(), event.getReceiverAccount());
            try {
                accountService.credit(event.getReceiverAccount(), event.getAmount(), event.getTransferId());

                Account account = accountRepository.findByAccountNumber(event.getReceiverAccount()).orElseThrow();
                eventProducer.sendCreditCompleted(CreditCompletedEvent.builder()
                        .eventType("CREDIT_COMPLETED")
                        .transferId(event.getTransferId())
                        .accountNumber(event.getReceiverAccount())
                        .amount(event.getAmount())
                        .balanceAfter(account.getBalance())
                        .timestamp(LocalDateTime.now())
                        .build());
            } catch (Exception e) {
                log.error("Credit failed: transferId={}, reason={}", event.getTransferId(), e.getMessage());
                eventProducer.sendCreditFailed(CreditFailedEvent.builder()
                        .eventType("CREDIT_FAILED")
                        .transferId(event.getTransferId())
                        .accountNumber(event.getReceiverAccount())
                        .senderAccount(event.getSenderAccount())
                        .receiverAccount(event.getReceiverAccount())
                        .amount(event.getAmount())
                        .reason(e.getMessage())
                        .timestamp(LocalDateTime.now())
                        .build());
            }
        });
    }

    @KafkaListener(topics = "credit-failed", groupId = "account-service-rollback-group")
    public void handleCreditFailed(CreditFailedEvent event) {
        withTransferId(event.getTransferId(), () -> {
            log.info("Credit failed, rollback debit: transferId={}, senderAccount={}",
                    event.getTransferId(), event.getSenderAccount());
            try {
                accountService.rollbackDebit(event.getSenderAccount(), event.getAmount(), event.getTransferId());
                log.info("Rollback completed: transferId={}", event.getTransferId());
            } catch (Exception e) {
                log.error("Rollback failed, manual action needed: transferId={}", event.getTransferId(), e);
            }
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
