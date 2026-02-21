package com.quicktransfer.account.service;

import com.quicktransfer.account.domain.Account;
import com.quicktransfer.account.domain.Account.AccountStatus;
import com.quicktransfer.account.domain.TransactionLog;
import com.quicktransfer.account.domain.TransactionLog.TransactionType;
import com.quicktransfer.account.repository.AccountRepository;
import com.quicktransfer.account.repository.TransactionLogRepository;
import com.quicktransfer.common.exception.BusinessException;
import com.quicktransfer.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AccountService {

    private final AccountRepository accountRepository;
    private final TransactionLogRepository transactionLogRepository;

    @Transactional
    public Account createAccount(String ownerName) {
        String accountNumber = generateAccountNumber();

        Account account = Account.builder()
                .accountNumber(accountNumber)
                .ownerName(ownerName)
                .balance(BigDecimal.ZERO)
                .status(AccountStatus.ACTIVE)
                .build();

        return accountRepository.save(account);
    }

    @Transactional(readOnly = true)
    public List<Account> getAllAccounts() {
        return accountRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Account getAccount(String accountNumber) {
        return accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new BusinessException(ErrorCode.ACCOUNT_NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public Page<TransactionLog> getTransactions(String accountNumber, Pageable pageable) {
        Account account = getAccount(accountNumber);
        return transactionLogRepository.findByAccountIdOrderByCreatedAtDesc(account.getId(), pageable);
    }

    @Transactional
    public void debit(String accountNumber, BigDecimal amount, String transferId) {
        if (transactionLogRepository.existsByTransferIdAndType(transferId, TransactionType.DEBIT)) {
            log.info("이미 처리된 출금 이벤트: transferId={}", transferId);
            return;
        }

        Account account = accountRepository.findByAccountNumberForUpdate(accountNumber)
                .orElseThrow(() -> new BusinessException(ErrorCode.ACCOUNT_NOT_FOUND));

        BigDecimal balanceBefore = account.getBalance();
        account.debit(amount);

        transactionLogRepository.save(TransactionLog.builder()
                .accountId(account.getId())
                .type(TransactionType.DEBIT)
                .amount(amount)
                .balanceBefore(balanceBefore)
                .balanceAfter(account.getBalance())
                .transferId(transferId)
                .description("송금 출금")
                .build());

        log.info("출금 완료: account={}, amount={}, balance={}", accountNumber, amount, account.getBalance());
    }

    @Transactional
    public void credit(String accountNumber, BigDecimal amount, String transferId) {
        if (transactionLogRepository.existsByTransferIdAndType(transferId, TransactionType.CREDIT)) {
            log.info("이미 처리된 입금 이벤트: transferId={}", transferId);
            return;
        }

        Account account = accountRepository.findByAccountNumberForUpdate(accountNumber)
                .orElseThrow(() -> new BusinessException(ErrorCode.ACCOUNT_NOT_FOUND));

        BigDecimal balanceBefore = account.getBalance();
        account.credit(amount);

        transactionLogRepository.save(TransactionLog.builder()
                .accountId(account.getId())
                .type(TransactionType.CREDIT)
                .amount(amount)
                .balanceBefore(balanceBefore)
                .balanceAfter(account.getBalance())
                .transferId(transferId)
                .description("송금 입금")
                .build());

        log.info("입금 완료: account={}, amount={}, balance={}", accountNumber, amount, account.getBalance());
    }

    @Transactional
    public void rollbackDebit(String accountNumber, BigDecimal amount, String transferId) {
        if (transactionLogRepository.existsByTransferIdAndType(transferId, TransactionType.ROLLBACK)) {
            log.info("이미 처리된 롤백 이벤트: transferId={}", transferId);
            return;
        }

        Account account = accountRepository.findByAccountNumberForUpdate(accountNumber)
                .orElseThrow(() -> new BusinessException(ErrorCode.ACCOUNT_NOT_FOUND));

        BigDecimal balanceBefore = account.getBalance();
        account.credit(amount);

        transactionLogRepository.save(TransactionLog.builder()
                .accountId(account.getId())
                .type(TransactionType.ROLLBACK)
                .amount(amount)
                .balanceBefore(balanceBefore)
                .balanceAfter(account.getBalance())
                .transferId(transferId)
                .description("송금 실패 - 출금 롤백")
                .build());

        log.info("롤백 완료: account={}, amount={}, balance={}", accountNumber, amount, account.getBalance());
    }

    private String generateAccountNumber() {
        String number;
        do {
            number = "1000-" + String.format("%04d", (int) (Math.random() * 10000));
        } while (accountRepository.existsByAccountNumber(number));
        return number;
    }
}
