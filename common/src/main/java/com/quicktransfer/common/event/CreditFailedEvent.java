package com.quicktransfer.common.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreditFailedEvent {

    private String eventType;
    private String transferId;
    private String accountNumber;
    private String senderAccount;
    private String receiverAccount;
    private BigDecimal amount;
    private String reason;
    private LocalDateTime timestamp;
}
