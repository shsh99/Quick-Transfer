package com.quicktransfer.account.producer;

import com.quicktransfer.common.event.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AccountEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void sendDebitCompleted(DebitCompletedEvent event) {
        log.info("출금 완료 이벤트 발행: transferId={}", event.getTransferId());
        kafkaTemplate.send("debit-completed", event.getTransferId(), event);
    }

    public void sendDebitFailed(DebitFailedEvent event) {
        log.info("출금 실패 이벤트 발행: transferId={}", event.getTransferId());
        kafkaTemplate.send("debit-failed", event.getTransferId(), event);
    }

    public void sendCreditCompleted(CreditCompletedEvent event) {
        log.info("입금 완료 이벤트 발행: transferId={}", event.getTransferId());
        kafkaTemplate.send("credit-completed", event.getTransferId(), event);
    }

    public void sendCreditFailed(CreditFailedEvent event) {
        log.info("입금 실패 이벤트 발행: transferId={}", event.getTransferId());
        kafkaTemplate.send("credit-failed", event.getTransferId(), event);
    }
}
