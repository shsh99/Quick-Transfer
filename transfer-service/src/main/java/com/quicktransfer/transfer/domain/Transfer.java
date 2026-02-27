package com.quicktransfer.transfer.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;

@Entity
@Table(
        name = "transfers",
        indexes = {
                @Index(name = "idx_transfer_sender_created", columnList = "sender_account, created_at")
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Transfer {

    private static final Map<TransferStatus, Set<TransferStatus>> VALID_TRANSITIONS = Map.of(
            TransferStatus.PENDING, Set.of(TransferStatus.DEBITED, TransferStatus.FAILED),
            TransferStatus.DEBITED, Set.of(TransferStatus.SUCCESS, TransferStatus.FAILED),
            TransferStatus.SUCCESS, Set.of(),
            TransferStatus.FAILED, Set.of()
    );

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

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    public enum TransferStatus {
        PENDING, DEBITED, SUCCESS, FAILED
    }

    public boolean canTransitionTo(TransferStatus newStatus) {
        return VALID_TRANSITIONS.getOrDefault(this.status, Set.of()).contains(newStatus);
    }

    public void updateStatus(TransferStatus newStatus) {
        if (!canTransitionTo(newStatus)) {
            throw new IllegalStateException(
                    String.format("잘못된 상태 전이: %s → %s (transferId=%s)", this.status, newStatus, this.transferId));
        }
        this.status = newStatus;
        if (newStatus == TransferStatus.SUCCESS || newStatus == TransferStatus.FAILED) {
            this.completedAt = LocalDateTime.now();
        }
    }

    public void fail(String reason) {
        if (!canTransitionTo(TransferStatus.FAILED)) {
            throw new IllegalStateException(
                    String.format("잘못된 상태 전이: %s → FAILED (transferId=%s)", this.status, this.transferId));
        }
        this.status = TransferStatus.FAILED;
        this.failReason = reason;
        this.completedAt = LocalDateTime.now();
    }
}
