package com.gramai.common.dto;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

public record ErrorResponse(
        boolean success,
        String errorCode,
        String message,
        List<FieldErrorDto> errors,
        Instant timestamp
) {
    public static ErrorResponse of(String errorCode, String message) {
        return new ErrorResponse(false, errorCode, message, Collections.emptyList(), Instant.now());
    }

    public static ErrorResponse of(String errorCode, String message, List<FieldErrorDto> errors) {
        return new ErrorResponse(false, errorCode, message, errors != null ? errors : Collections.emptyList(), Instant.now());
    }
}
