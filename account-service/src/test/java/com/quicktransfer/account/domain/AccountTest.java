package com.quicktransfer.account.domain;

import com.quicktransfer.account.domain.Account.AccountStatus;
import com.quicktransfer.common.exception.BusinessException;
import com.quicktransfer.common.exception.ErrorCode;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AccountTest {

    @Test
    void debit_shouldSubtractBalance() {
        Account account = Account.builder()
                .accountNumber("1000-0001")
                .ownerName("tester")
                .balance(new BigDecimal("1000.00"))
                .status(AccountStatus.ACTIVE)
                .build();

        account.debit(new BigDecimal("250.00"));

        assertThat(account.getBalance()).isEqualByComparingTo("750.00");
    }

    @Test
    void debit_shouldThrowWhenInsufficientBalance() {
        Account account = Account.builder()
                .accountNumber("1000-0002")
                .ownerName("tester")
                .balance(new BigDecimal("100.00"))
                .status(AccountStatus.ACTIVE)
                .build();

        assertThatThrownBy(() -> account.debit(new BigDecimal("150.00")))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INSUFFICIENT_BALANCE);
    }

    @Test
    void credit_shouldThrowWhenAccountIsNotActive() {
        Account account = Account.builder()
                .accountNumber("1000-0003")
                .ownerName("tester")
                .balance(new BigDecimal("100.00"))
                .status(AccountStatus.FROZEN)
                .build();

        assertThatThrownBy(() -> account.credit(new BigDecimal("50.00")))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.ACCOUNT_FROZEN);
    }
}
