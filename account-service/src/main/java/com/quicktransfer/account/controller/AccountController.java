package com.quicktransfer.account.controller;

import com.quicktransfer.account.domain.Account;
import com.quicktransfer.account.domain.TransactionLog;
import com.quicktransfer.account.service.AccountService;
import com.quicktransfer.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<AccountResponse> createAccount(@RequestBody CreateAccountRequest request) {
        Account account = accountService.createAccount(request.ownerName());
        return ApiResponse.ok(AccountResponse.from(account));
    }

    @GetMapping
    public ApiResponse<List<AccountResponse>> getAllAccounts() {
        List<AccountResponse> accounts = accountService.getAllAccounts().stream()
                .map(AccountResponse::from)
                .toList();
        return ApiResponse.ok(accounts);
    }

    @GetMapping("/{accountNumber}")
    public ApiResponse<AccountResponse> getAccount(@PathVariable String accountNumber) {
        Account account = accountService.getAccount(accountNumber);
        return ApiResponse.ok(AccountResponse.from(account));
    }

    @GetMapping("/{accountNumber}/transactions")
    public ApiResponse<Page<TransactionLog>> getTransactions(
            @PathVariable String accountNumber,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.ok(accountService.getTransactions(accountNumber, pageable));
    }

    public record CreateAccountRequest(String ownerName) {}

    public record AccountResponse(
            Long id,
            String accountNumber,
            String ownerName,
            java.math.BigDecimal balance,
            String status,
            java.time.LocalDateTime createdAt
    ) {
        static AccountResponse from(Account account) {
            return new AccountResponse(
                    account.getId(),
                    account.getAccountNumber(),
                    account.getOwnerName(),
                    account.getBalance(),
                    account.getStatus().name(),
                    account.getCreatedAt()
            );
        }
    }
}
