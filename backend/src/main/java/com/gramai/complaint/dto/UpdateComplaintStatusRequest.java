package com.gramai.complaint.dto;

import com.gramai.complaint.ComplaintStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateComplaintStatusRequest(
        @NotNull(message = "Target status is required")
        ComplaintStatus status,

        String resolution,

        String note
) {
}
