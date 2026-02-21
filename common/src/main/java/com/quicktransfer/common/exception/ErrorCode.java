package com.quicktransfer.common.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // Account
    ACCOUNT_NOT_FOUND("A001", "계좌를 찾을 수 없습니다"),
    INSUFFICIENT_BALANCE("A002", "잔액이 부족합니다"),
    ACCOUNT_FROZEN("A003", "동결된 계좌입니다"),
    DUPLICATE_ACCOUNT("A004", "이미 존재하는 계좌번호입니다"),

    // Transfer
    TRANSFER_NOT_FOUND("T001", "송금 내역을 찾을 수 없습니다"),
    DUPLICATE_TRANSFER("T002", "중복된 송금 요청입니다"),
    SAME_ACCOUNT_TRANSFER("T003", "동일 계좌로 송금할 수 없습니다"),
    INVALID_AMOUNT("T004", "유효하지 않은 금액입니다"),

    // Common
    INTERNAL_ERROR("C001", "내부 서버 오류가 발생했습니다"),
    INVALID_REQUEST("C002", "잘못된 요청입니다");

    private final String code;
    private final String message;
}
