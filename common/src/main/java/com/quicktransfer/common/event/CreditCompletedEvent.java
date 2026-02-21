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
public class CreditCompletedEvent {

    private String eventType;
    private String transferId;
    private String accountNumber;
    private BigDecimal amount;
    private BigDecimal balanceAfter;
    private LocalDateTime timestamp;
}
