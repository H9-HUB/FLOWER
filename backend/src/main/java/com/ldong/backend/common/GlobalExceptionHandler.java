package com.ldong.backend.common;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ResponseStatus(HttpStatus.BAD_REQUEST)   // 400
    @ExceptionHandler(RuntimeException.class)
    public R<Void> handle(RuntimeException e) {
        return R.error(e.getMessage());
    }
}