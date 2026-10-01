package com.gramai.complaint.dto;

public record AssignComplaintRequest(
        Long assignedTo,
        String note
) {
}
