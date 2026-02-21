package com.quicktransfer.account.exception;

import com.quicktransfer.common.exception.BusinessException;
import com.quicktransfer.common.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleBusinessException(BusinessException e) {
        log.warn("비즈니스 예외: {}", e.getMessage());
        return ApiResponse.error(e.getErrorCode().getCode(), e.getMessage());
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<Void> handleException(Exception e) {
        log.error("서버 오류", e);
        return ApiResponse.error("C001", "내부 서버 오류가 발생했습니다");
    }
}
