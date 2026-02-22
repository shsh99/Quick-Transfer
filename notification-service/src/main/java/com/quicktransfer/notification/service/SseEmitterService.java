package com.quicktransfer.notification.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@Slf4j
public class SseEmitterService {

    private final Map<String, List<SseEmitter>> emitters = new ConcurrentHashMap<>();

    private static final long SSE_TIMEOUT = 30 * 60 * 1000L; // 30분

    public SseEmitter subscribe(String accountNumber) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);

        List<SseEmitter> accountEmitters = emitters.computeIfAbsent(accountNumber, k -> new CopyOnWriteArrayList<>());
        accountEmitters.add(emitter);
        log.info("SSE 구독: accountNumber={}, 연결수={}", accountNumber, accountEmitters.size());

        Runnable removeEmitter = () -> {
            accountEmitters.remove(emitter);
            if (accountEmitters.isEmpty()) {
                emitters.remove(accountNumber);
            }
            log.info("SSE 연결 제거: accountNumber={}, 남은 연결수={}", accountNumber, accountEmitters.size());
        };

        emitter.onCompletion(removeEmitter);
        emitter.onTimeout(removeEmitter);
        emitter.onError(e -> removeEmitter.run());

        try {
            emitter.send(SseEmitter.event()
                    .name("connect")
                    .data("SSE 연결 성공: " + accountNumber));
        } catch (IOException e) {
            removeEmitter.run();
        }

        return emitter;
    }

    public void sendToAccount(String accountNumber, Object data) {
        List<SseEmitter> accountEmitters = emitters.get(accountNumber);
        if (accountEmitters == null || accountEmitters.isEmpty()) {
            log.debug("SSE 구독자 없음: accountNumber={}", accountNumber);
            return;
        }

        List<SseEmitter> deadEmitters = new java.util.ArrayList<>();
        for (SseEmitter emitter : accountEmitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("notification")
                        .data(data));
            } catch (IOException e) {
                deadEmitters.add(emitter);
            }
        }

        if (!deadEmitters.isEmpty()) {
            accountEmitters.removeAll(deadEmitters);
            if (accountEmitters.isEmpty()) {
                emitters.remove(accountNumber);
            }
            log.warn("SSE 전송 실패 제거: accountNumber={}, 제거={}, 남은={}", accountNumber, deadEmitters.size(), accountEmitters.size());
        } else {
            log.info("SSE 알림 전송: accountNumber={}, 연결수={}", accountNumber, accountEmitters.size());
        }
    }
}
