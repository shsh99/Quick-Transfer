package com.quicktransfer.transfer.service;

import com.quicktransfer.common.event.TransferRequestedEvent;
import com.quicktransfer.common.exception.BusinessException;
import com.quicktransfer.common.exception.ErrorCode;
import com.quicktransfer.transfer.domain.Transfer;
import com.quicktransfer.transfer.producer.TransferEventProducer;
import com.quicktransfer.transfer.repository.TransferRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransferServiceTest {

    @Mock
    private TransferRepository transferRepository;

    @Mock
    private TransferEventProducer eventProducer;

    @InjectMocks
    private TransferService transferService;

    @Test
    void createTransfer_shouldThrowWhenSenderAndReceiverAreSame() {
        assertThatThrownBy(() -> transferService.createTransfer("1000-0001", "1000-0001", new BigDecimal("10.00")))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.SAME_ACCOUNT_TRANSFER);

        verify(transferRepository, never()).save(any());
        verify(eventProducer, never()).sendTransferRequested(any());
    }

    @Test
    void createTransfer_shouldThrowWhenAmountIsInvalid() {
        assertThatThrownBy(() -> transferService.createTransfer("1000-0001", "1000-0002", BigDecimal.ZERO))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_AMOUNT);

        verify(transferRepository, never()).save(any());
        verify(eventProducer, never()).sendTransferRequested(any());
    }

    @Test
    void createTransfer_shouldSaveTransferAndPublishEvent() {
        Transfer saved = Transfer.builder()
                .id(1L)
                .transferId("generated-id")
                .senderAccount("1000-0001")
                .receiverAccount("1000-0002")
                .amount(new BigDecimal("30.00"))
                .status(Transfer.TransferStatus.PENDING)
                .build();
        when(transferRepository.save(any(Transfer.class))).thenReturn(saved);

        Transfer result = transferService.createTransfer("1000-0001", "1000-0002", new BigDecimal("30.00"));

        ArgumentCaptor<TransferRequestedEvent> eventCaptor = ArgumentCaptor.forClass(TransferRequestedEvent.class);
        verify(eventProducer).sendTransferRequested(eventCaptor.capture());

        TransferRequestedEvent publishedEvent = eventCaptor.getValue();
        assertThat(result.getStatus()).isEqualTo(Transfer.TransferStatus.PENDING);
        assertThat(publishedEvent.getSenderAccount()).isEqualTo("1000-0001");
        assertThat(publishedEvent.getReceiverAccount()).isEqualTo("1000-0002");
        assertThat(publishedEvent.getAmount()).isEqualByComparingTo("30.00");
        assertThat(publishedEvent.getTransferId()).isNotBlank();
    }

    @Test
    void getTransfer_shouldThrowWhenTransferNotFound() {
        when(transferRepository.findByTransferId("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> transferService.getTransfer("missing"))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.TRANSFER_NOT_FOUND);
    }
}
