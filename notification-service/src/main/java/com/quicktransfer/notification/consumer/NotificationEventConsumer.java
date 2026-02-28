package com.quicktransfer.notification.consumer;

import com.quicktransfer.common.event.TransferCompletedEvent;
import com.quicktransfer.common.event.TransferFailedEvent;
import com.quicktransfer.notification.service.NotificationFanoutMessage;
import com.quicktransfer.notification.service.RedisNotificationFanoutPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEventConsumer {

    private final RedisNotificationFanoutPublisher fanoutPublisher;

    @KafkaListener(topics = "transfer-completed", groupId = "notification-service-group")
    public void handleTransferCompleted(TransferCompletedEvent event) {
        log.info("송금 완료 알림: transferId={}", event.getTransferId());

        fanoutPublisher.publish(NotificationFanoutMessage.builder()
                .accountNumber(event.getSenderAccount())
                .type("TRANSFER_COMPLETED")
                .transferId(event.getTransferId())
                .senderAccount(event.getSenderAccount())
                .receiverAccount(event.getReceiverAccount())
                .amount(event.getAmount())
                .message(event.getReceiverAccount() + "에게 " + event.getAmount() + "원 송금 완료")
                .timestamp(event.getTimestamp().toString())
                .build());

        fanoutPublisher.publish(NotificationFanoutMessage.builder()
                .accountNumber(event.getReceiverAccount())
                .type("TRANSFER_COMPLETED")
                .transferId(event.getTransferId())
                .senderAccount(event.getSenderAccount())
                .receiverAccount(event.getReceiverAccount())
                .amount(event.getAmount())
                .message(event.getSenderAccount() + "로부터 " + event.getAmount() + "원 입금")
                .timestamp(event.getTimestamp().toString())
                .build());
    }

    @KafkaListener(topics = "transfer-failed", groupId = "notification-service-group")
    public void handleTransferFailed(TransferFailedEvent event) {
        log.info("송금 실패 알림: transferId={}, reason={}", event.getTransferId(), event.getReason());

        fanoutPublisher.publish(NotificationFanoutMessage.builder()
                .accountNumber(event.getSenderAccount())
                .type("TRANSFER_FAILED")
                .transferId(event.getTransferId())
                .senderAccount(event.getSenderAccount())
                .receiverAccount(event.getReceiverAccount())
                .amount(event.getAmount())
                .message("송금 실패: " + event.getReason())
                .timestamp(event.getTimestamp().toString())
                .build());
    }
}
