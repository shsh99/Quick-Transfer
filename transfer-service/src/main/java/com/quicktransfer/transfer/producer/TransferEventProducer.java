package com.quicktransfer.transfer.producer;

import com.quicktransfer.common.event.TransferCompletedEvent;
import com.quicktransfer.common.event.TransferFailedEvent;
import com.quicktransfer.common.event.TransferRequestedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class TransferEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void sendTransferRequested(TransferRequestedEvent event) {
        log.info("송금 요청 이벤트 발행: transferId={}", event.getTransferId());
        kafkaTemplate.send("transfer-requested", event.getTransferId(), event);
    }

    public void sendTransferCompleted(TransferCompletedEvent event) {
        log.info("송금 완료 이벤트 발행: transferId={}", event.getTransferId());
        kafkaTemplate.send("transfer-completed", event.getTransferId(), event);
    }

    public void sendTransferFailed(TransferFailedEvent event) {
        log.info("송금 실패 이벤트 발행: transferId={}", event.getTransferId());
        kafkaTemplate.send("transfer-failed", event.getTransferId(), event);
    }
}
