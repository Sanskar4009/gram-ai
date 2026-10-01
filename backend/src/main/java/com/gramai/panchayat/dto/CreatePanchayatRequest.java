package com.gramai.panchayat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreatePanchayatRequest(
        @NotBlank(message = "Panchayat name is required")
        @Size(max = 100, message = "Panchayat name must not exceed 100 characters")
        String name,

        @NotBlank(message = "Panchayat code is required")
        @Size(max = 50, message = "Panchayat code must not exceed 50 characters")
        String code,

        @NotBlank(message = "District is required")
        @Size(max = 100, message = "District must not exceed 100 characters")
        String district,

        @NotBlank(message = "Block is required")
        @Size(max = 100, message = "Block must not exceed 100 characters")
        String block,

        @NotBlank(message = "State is required")
        @Size(max = 100, message = "State must not exceed 100 characters")
        String state
) {}
