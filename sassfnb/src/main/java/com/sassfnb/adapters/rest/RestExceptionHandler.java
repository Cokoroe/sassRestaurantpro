package com.sassfnb.adapters.rest;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** Chuẩn hoá lỗi trả về cho REST. */
@RestControllerAdvice
public class RestExceptionHandler {

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<?> handleIllegalState(IllegalStateException ex) {
        if ("NO_TENANT".equals(ex.getMessage())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiError("NO_ACTIVE_RESTAURANT",
                            "Thiếu ngữ cảnh nhà hàng. Gửi header X-Restaurant-Id: <UUID> để tiếp tục."));
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiError("ILLEGAL_STATE", ex.getMessage()));
    }

    public record ApiError(String code, String message) {
    }
}
