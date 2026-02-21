package com.quicktransfer.account.consumer;

import com.quicktransfer.account.domain.Account;
import com.quicktransfer.account.producer.AccountEventProducer;
import com.quicktransfer.account.repository.AccountRepository;
import com.quicktransfer.account.service.AccountService;
import com.quicktransfer.common.event.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    /**
     * 1단계: transfer-requested → 출금 처리
     */
    @KafkaListener(topics = "transfer-requested", groupId = "account-service-group")
    public void handleTransferRequested(TransferRequestedEvent event) {
        log.info("송금 요청 수신: transferId={}, 출금계좌={}", event.getTransferId(), event.getSenderAccount());
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
            log.error("출금 실패: transferId={}, reason={}", event.getTransferId(), e.getMessage());
            eventProducer.sendDebitFailed(DebitFailedEvent.builder()
                    .eventType("DEBIT_FAILED")
                    .transferId(event.getTransferId())
                    .accountNumber(event.getSenderAccount())
                    .amount(event.getAmount())
                    .reason(e.getMessage())
                    .timestamp(LocalDateTime.now())
                    .build());
        }
    }

    /**
     * 2단계: debit-completed → 입금 처리
     */
    @KafkaListener(topics = "debit-completed", groupId = "account-service-credit-group")
    public void handleDebitCompleted(DebitCompletedEvent event) {
        log.info("출금 완료 수신 → 입금 시작: transferId={}, 입금계좌={}", event.getTransferId(), event.getReceiverAccount());
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
            log.error("입금 실패: transferId={}, reason={}", event.getTransferId(), e.getMessage());
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
    }

    /**
     * 3단계: credit-failed → 보상 트랜잭션 (출금 롤백)
     */
    @KafkaListener(topics = "credit-failed", groupId = "account-service-rollback-group")
    public void handleCreditFailed(CreditFailedEvent event) {
        log.info("입금 실패 수신 → 출금 롤백: transferId={}, 출금계좌={}", event.getTransferId(), event.getSenderAccount());
        try {
            accountService.rollbackDebit(event.getSenderAccount(), event.getAmount(), event.getTransferId());
            log.info("보상 트랜잭션 완료: transferId={}", event.getTransferId());
        } catch (Exception e) {
            log.error("롤백 실패 - 수동 개입 필요: transferId={}", event.getTransferId(), e);
        }
    }
}
