package com.quicktransfer.notification.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationRedisSubscriber {

    private final ObjectMapper objectMapper;
    private final SseEmitterService sseEmitterService;

    public void onMessage(byte[] payload, byte[] channel) {
        try {
            String body = new String(payload, StandardCharsets.UTF_8);
            NotificationFanoutMessage message = objectMapper.readValue(body, NotificationFanoutMessage.class);
            sseEmitterService.sendToAccount(message.getAccountNumber(), Map.of(
                    "type", message.getType(),
                    "transferId", message.getTransferId(),
                    "senderAccount", message.getSenderAccount(),
                    "receiverAccount", message.getReceiverAccount(),
                    "amount", message.getAmount(),
                    "message", message.getMessage(),
                    "timestamp", message.getTimestamp()
            ));
        } catch (Exception e) {
            log.error("Redis 알림 역직렬화/전송 실패: channel={}",
                    new String(channel, StandardCharsets.UTF_8), e);
        }
    }
}
