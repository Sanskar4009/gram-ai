package com.gramai.complaint.dto;

import jakarta.validation.constraints.NotBlank;

public record ResolveComplaintRequest(
        @NotBlank(message = "Resolution note is required to resolve a complaint")
        String resolution,

        String additionalNotes
) {
}
