package com.quicktransfer.transfer.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transfers")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Transfer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "transfer_id", nullable = false, unique = true, length = 36)
    private String transferId;

    @Column(name = "sender_account", nullable = false, length = 20)
    private String senderAccount;

    @Column(name = "receiver_account", nullable = false, length = 20)
    private String receiverAccount;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TransferStatus status;

    @Column(name = "fail_reason", length = 500)
    private String failReason;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    public enum TransferStatus {
        PENDING, DEBITED, SUCCESS, FAILED
    }

    public void updateStatus(TransferStatus newStatus) {
        this.status = newStatus;
    }

    public void fail(String reason) {
        this.status = TransferStatus.FAILED;
        this.failReason = reason;
    }
}
