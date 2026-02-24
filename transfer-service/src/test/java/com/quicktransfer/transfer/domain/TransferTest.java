package com.quicktransfer.transfer.domain;

import com.quicktransfer.transfer.domain.Transfer.TransferStatus;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TransferTest {

    @Test
    void updateStatus_shouldAllowValidTransitions() {
        Transfer transfer = Transfer.builder()
                .transferId("tr-1")
                .senderAccount("1000-0001")
                .receiverAccount("1000-0002")
                .amount(new BigDecimal("100.00"))
                .status(TransferStatus.PENDING)
                .build();

        transfer.updateStatus(TransferStatus.DEBITED);
        transfer.updateStatus(TransferStatus.SUCCESS);

        assertThat(transfer.getStatus()).isEqualTo(TransferStatus.SUCCESS);
        assertThat(transfer.getCompletedAt()).isNotNull();
    }

    @Test
    void updateStatus_shouldThrowWhenTransitionIsInvalid() {
        Transfer transfer = Transfer.builder()
                .transferId("tr-2")
                .senderAccount("1000-0001")
                .receiverAccount("1000-0002")
                .amount(new BigDecimal("100.00"))
                .status(TransferStatus.PENDING)
                .build();

        assertThatThrownBy(() -> transfer.updateStatus(TransferStatus.SUCCESS))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void fail_shouldSetFailedStateReasonAndCompletedAt() {
        Transfer transfer = Transfer.builder()
                .transferId("tr-3")
                .senderAccount("1000-0001")
                .receiverAccount("1000-0002")
                .amount(new BigDecimal("100.00"))
                .status(TransferStatus.DEBITED)
                .build();

        transfer.fail("credit failed");

        assertThat(transfer.getStatus()).isEqualTo(TransferStatus.FAILED);
        assertThat(transfer.getFailReason()).isEqualTo("credit failed");
        assertThat(transfer.getCompletedAt()).isNotNull();
    }
}
