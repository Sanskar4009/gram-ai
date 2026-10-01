package com.gramai.complaint.dto;

import com.gramai.complaint.ComplaintCategory;
import com.gramai.complaint.ComplaintPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateComplaintRequest(
        @NotNull(message = "Citizen ID is required")
        Long citizenId,

        @NotNull(message = "Complaint category is required")
        ComplaintCategory category,

        @NotBlank(message = "Title is required")
        @Size(max = 255, message = "Title cannot exceed 255 characters")
        String title,

        @NotBlank(message = "Description is required")
        String description,

        ComplaintPriority priority,

        Long assignedTo,

        Long panchayatId
) {
    public ComplaintPriority resolvedPriority() {
        return priority != null ? priority : ComplaintPriority.MEDIUM;
    }
}
