package com.quicktransfer.notification.consumer;

import com.quicktransfer.common.event.TransferCompletedEvent;
import com.quicktransfer.common.event.TransferFailedEvent;
import com.quicktransfer.notification.service.SseEmitterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEventConsumer {

    private final SseEmitterService sseEmitterService;

    @KafkaListener(topics = "transfer-completed", groupId = "notification-service-group")
    public void handleTransferCompleted(TransferCompletedEvent event) {
        log.info("송금 완료 알림: transferId={}", event.getTransferId());

        // 송금자에게 알림
        sseEmitterService.sendToAccount(event.getSenderAccount(), Map.of(
                "type", "TRANSFER_COMPLETED",
                "transferId", event.getTransferId(),
                "senderAccount", event.getSenderAccount(),
                "receiverAccount", event.getReceiverAccount(),
                "amount", event.getAmount(),
                "message", event.getReceiverAccount() + "에게 " + event.getAmount() + "원 송금 완료",
                "timestamp", event.getTimestamp().toString()
        ));

        // 수취인에게 알림
        sseEmitterService.sendToAccount(event.getReceiverAccount(), Map.of(
                "type", "TRANSFER_COMPLETED",
                "transferId", event.getTransferId(),
                "senderAccount", event.getSenderAccount(),
                "receiverAccount", event.getReceiverAccount(),
                "amount", event.getAmount(),
                "message", event.getSenderAccount() + "로부터 " + event.getAmount() + "원 입금",
                "timestamp", event.getTimestamp().toString()
        ));
    }

    @KafkaListener(topics = "transfer-failed", groupId = "notification-service-group")
    public void handleTransferFailed(TransferFailedEvent event) {
        log.info("송금 실패 알림: transferId={}, reason={}", event.getTransferId(), event.getReason());

        sseEmitterService.sendToAccount(event.getSenderAccount(), Map.of(
                "type", "TRANSFER_FAILED",
                "transferId", event.getTransferId(),
                "senderAccount", event.getSenderAccount(),
                "receiverAccount", event.getReceiverAccount(),
                "amount", event.getAmount(),
                "message", "송금 실패: " + event.getReason(),
                "timestamp", event.getTimestamp().toString()
        ));
    }
}
