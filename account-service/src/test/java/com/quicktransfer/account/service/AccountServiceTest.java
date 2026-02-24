package com.quicktransfer.account.service;

import com.quicktransfer.account.domain.Account;
import com.quicktransfer.account.domain.Account.AccountStatus;
import com.quicktransfer.account.domain.TransactionLog;
import com.quicktransfer.account.repository.AccountRepository;
import com.quicktransfer.account.repository.TransactionLogRepository;
import com.quicktransfer.common.exception.BusinessException;
import com.quicktransfer.common.exception.ErrorCode;
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
class AccountServiceTest {

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private TransactionLogRepository transactionLogRepository;

    @InjectMocks
    private AccountService accountService;

    @Test
    void debit_shouldReturnEarlyWhenDuplicateEvent() {
        when(transactionLogRepository.existsByTransferIdAndType("tx-1", TransactionLog.TransactionType.DEBIT))
                .thenReturn(true);

        accountService.debit("1000-0001", new BigDecimal("100.00"), "tx-1");

        verify(accountRepository, never()).findByAccountNumberForUpdate(any());
        verify(transactionLogRepository, never()).save(any());
    }

    @Test
    void debit_shouldUpdateBalanceAndSaveTransactionLog() {
        Account account = Account.builder()
                .id(1L)
                .accountNumber("1000-0001")
                .ownerName("tester")
                .balance(new BigDecimal("500.00"))
                .status(AccountStatus.ACTIVE)
                .build();

        when(transactionLogRepository.existsByTransferIdAndType("tx-2", TransactionLog.TransactionType.DEBIT))
                .thenReturn(false);
        when(accountRepository.findByAccountNumberForUpdate("1000-0001"))
                .thenReturn(Optional.of(account));

        accountService.debit("1000-0001", new BigDecimal("120.00"), "tx-2");

        ArgumentCaptor<TransactionLog> captor = ArgumentCaptor.forClass(TransactionLog.class);
        verify(transactionLogRepository).save(captor.capture());

        TransactionLog savedLog = captor.getValue();
        assertThat(account.getBalance()).isEqualByComparingTo("380.00");
        assertThat(savedLog.getType()).isEqualTo(TransactionLog.TransactionType.DEBIT);
        assertThat(savedLog.getBalanceBefore()).isEqualByComparingTo("500.00");
        assertThat(savedLog.getBalanceAfter()).isEqualByComparingTo("380.00");
        assertThat(savedLog.getTransferId()).isEqualTo("tx-2");
    }

    @Test
    void debit_shouldThrowWhenAccountNotFound() {
        when(transactionLogRepository.existsByTransferIdAndType("tx-3", TransactionLog.TransactionType.DEBIT))
                .thenReturn(false);
        when(accountRepository.findByAccountNumberForUpdate("1000-9999"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> accountService.debit("1000-9999", new BigDecimal("10.00"), "tx-3"))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.ACCOUNT_NOT_FOUND);
    }
}
