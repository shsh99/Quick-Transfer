package com.quicktransfer.account.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "transaction_log",
        indexes = {
                @Index(name = "idx_transaction_log_account_created", columnList = "account_id, created_at")
        },
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_transaction_log_transfer_type", columnNames = {"transfer_id", "type"})
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class TransactionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_id", nullable = false)
    private Long accountId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TransactionType type;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "balance_before", nullable = false, precision = 18, scale = 2)
    private BigDecimal balanceBefore;

    @Column(name = "balance_after", nullable = false, precision = 18, scale = 2)
    private BigDecimal balanceAfter;

    @Column(name = "transfer_id", length = 36)
    private String transferId;

    @Column(length = 500)
    private String description;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum TransactionType {
        DEBIT, CREDIT, ROLLBACK
    }
}
