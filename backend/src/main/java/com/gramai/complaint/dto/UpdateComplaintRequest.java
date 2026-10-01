package com.gramai.complaint.dto;

import com.gramai.complaint.ComplaintCategory;
import com.gramai.complaint.ComplaintPriority;
import jakarta.validation.constraints.Size;

public record UpdateComplaintRequest(
        Long citizenId,

        ComplaintCategory category,

        @Size(max = 255, message = "Title cannot exceed 255 characters")
        String title,

        String description,

        ComplaintPriority priority,

        Long assignedTo
) {
}
