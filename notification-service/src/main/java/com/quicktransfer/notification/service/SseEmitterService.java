package com.quicktransfer.notification.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class SseEmitterService {

    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();

    private static final long SSE_TIMEOUT = 30 * 60 * 1000L; // 30분

    public SseEmitter subscribe(String accountNumber) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);

        emitters.put(accountNumber, emitter);
        log.info("SSE 구독: accountNumber={}", accountNumber);

        emitter.onCompletion(() -> {
            emitters.remove(accountNumber);
            log.info("SSE 연결 종료: accountNumber={}", accountNumber);
        });
        emitter.onTimeout(() -> {
            emitters.remove(accountNumber);
            log.info("SSE 타임아웃: accountNumber={}", accountNumber);
        });
        emitter.onError(e -> {
            emitters.remove(accountNumber);
            log.warn("SSE 오류: accountNumber={}", accountNumber);
        });

        try {
            emitter.send(SseEmitter.event()
                    .name("connect")
                    .data("SSE 연결 성공: " + accountNumber));
        } catch (IOException e) {
            emitters.remove(accountNumber);
        }

        return emitter;
    }

    public void sendToAccount(String accountNumber, Object data) {
        SseEmitter emitter = emitters.get(accountNumber);
        if (emitter == null) {
            log.debug("SSE 구독자 없음: accountNumber={}", accountNumber);
            return;
        }

        try {
            emitter.send(SseEmitter.event()
                    .name("notification")
                    .data(data));
            log.info("SSE 알림 전송: accountNumber={}", accountNumber);
        } catch (IOException e) {
            emitters.remove(accountNumber);
            log.warn("SSE 전송 실패, 구독 제거: accountNumber={}", accountNumber);
        }
    }
}
