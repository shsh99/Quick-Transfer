package com.quicktransfer.transfer.controller;

import com.quicktransfer.common.response.ApiResponse;
import com.quicktransfer.transfer.domain.Transfer;
import com.quicktransfer.transfer.service.TransferService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/transfers")
@RequiredArgsConstructor
public class TransferController {

    private final TransferService transferService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<TransferResponse> createTransfer(@RequestBody CreateTransferRequest request) {
        Transfer transfer = transferService.createTransfer(
                request.senderAccount(), request.receiverAccount(), request.amount());
        return ApiResponse.ok(TransferResponse.from(transfer));
    }

    @GetMapping("/{transferId}")
    public ApiResponse<TransferResponse> getTransfer(@PathVariable String transferId) {
        Transfer transfer = transferService.getTransfer(transferId);
        return ApiResponse.ok(TransferResponse.from(transfer));
    }

    @GetMapping
    public ApiResponse<Page<TransferResponse>> getTransfers(
            @RequestParam String senderAccount,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.ok(transferService.getTransfers(senderAccount, pageable).map(TransferResponse::from));
    }

    public record CreateTransferRequest(String senderAccount, String receiverAccount, BigDecimal amount) {}

    public record TransferResponse(
            Long id, String transferId, String senderAccount, String receiverAccount,
            BigDecimal amount, String status, String failReason,
            java.time.LocalDateTime createdAt, java.time.LocalDateTime completedAt
    ) {
        static TransferResponse from(Transfer t) {
            return new TransferResponse(t.getId(), t.getTransferId(), t.getSenderAccount(),
                    t.getReceiverAccount(), t.getAmount(), t.getStatus().name(),
                    t.getFailReason(), t.getCreatedAt(), t.getCompletedAt());
        }
    }
}
