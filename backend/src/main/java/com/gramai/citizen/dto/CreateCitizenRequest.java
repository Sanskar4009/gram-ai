package com.gramai.citizen.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateCitizenRequest(
        @NotBlank(message = "Full name is required")
        @Size(min = 2, max = 150, message = "Full name must be between 2 and 150 characters")
        String fullName,

        @Pattern(regexp = "^$|^[0-9]{10,15}$", message = "Mobile number must be between 10 and 15 digits")
        String mobile,

        @NotBlank(message = "Village name is required")
        @Size(max = 100, message = "Village name cannot exceed 100 characters")
        String village,

        @NotNull(message = "Ward number is required")
        @Min(value = 1, message = "Ward number must be at least 1")
        @Max(value = 999, message = "Ward number cannot exceed 999")
        Integer wardNumber,

        @Size(max = 500, message = "Address cannot exceed 500 characters")
        String address,

        Long panchayatId
) {}
