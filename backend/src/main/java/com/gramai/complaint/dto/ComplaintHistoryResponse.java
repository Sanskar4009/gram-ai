package com.gramai.complaint.dto;

import com.gramai.complaint.ComplaintHistory;
import com.gramai.complaint.ComplaintStatus;

import java.time.Instant;

public record ComplaintHistoryResponse(
        Long id,
        Long complaintId,
        String action,
        ComplaintStatus fromStatus,
        ComplaintStatus toStatus,
        Long performedBy,
        String performedByName,
        String performedByRole,
        String details,
        Instant createdAt
) {
    public static ComplaintHistoryResponse from(ComplaintHistory history) {
        return new ComplaintHistoryResponse(
                history.getId(),
                history.getComplaintId(),
                history.getAction(),
                history.getFromStatus(),
                history.getToStatus(),
                history.getPerformedBy(),
                history.getPerformedByName(),
                history.getPerformedByRole(),
                history.getDetails(),
                history.getCreatedAt()
        );
    }
}
