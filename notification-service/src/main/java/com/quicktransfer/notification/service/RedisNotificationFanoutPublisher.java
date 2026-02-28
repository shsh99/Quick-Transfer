package com.quicktransfer.notification.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedisNotificationFanoutPublisher {

    public static final String CHANNEL_NAME = "transfer-notifications";

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public void publish(NotificationFanoutMessage message) {
        try {
            String payload = objectMapper.writeValueAsString(message);
            redisTemplate.convertAndSend(CHANNEL_NAME, payload);
        } catch (JsonProcessingException e) {
            log.error("알림 직렬화 실패: transferId={}", message.getTransferId(), e);
            throw new IllegalStateException("알림 직렬화 실패", e);
        }
    }
}
