package com.quicktransfer.notification.controller;

import com.quicktransfer.notification.service.SseEmitterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final SseEmitterService sseEmitterService;

    @GetMapping(value = "/{accountNumber}/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(@PathVariable String accountNumber) {
        return sseEmitterService.subscribe(accountNumber);
    }
}
