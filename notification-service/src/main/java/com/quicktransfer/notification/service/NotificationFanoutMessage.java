package com.quicktransfer.notification.service;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationFanoutMessage {
    private String accountNumber;
    private String type;
    private String transferId;
    private String senderAccount;
    private String receiverAccount;
    private BigDecimal amount;
    private String message;
    private String timestamp;
}
