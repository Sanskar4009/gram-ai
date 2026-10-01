package com.gramai.complaint.dto;

import com.gramai.citizen.Citizen;
import com.gramai.complaint.Complaint;
import com.gramai.complaint.ComplaintCategory;
import com.gramai.complaint.ComplaintPriority;
import com.gramai.complaint.ComplaintStatus;
import com.gramai.user.User;

import java.time.Instant;

public record ComplaintResponse(
        Long id,
        String complaintNumber,
        Long panchayatId,
        String panchayatName,
        Long citizenId,
        String citizenName,
        String citizenMobile,
        String citizenVillage,
        Integer citizenWardNumber,
        ComplaintCategory category,
        String categoryHindi,
        String categoryEnglish,
        String title,
        String description,
        ComplaintPriority priority,
        String priorityHindi,
        String priorityEnglish,
        ComplaintStatus status,
        String statusHindi,
        String statusEnglish,
        Long assignedTo,
        String assignedToName,
        String assignedToRole,
        String resolution,
        Instant createdAt,
        Instant updatedAt,
        Instant resolvedAt
) {
    public static ComplaintResponse from(Complaint complaint, String panchayatName, Citizen citizen, User assignedUser) {
        return new ComplaintResponse(
                complaint.getId(),
                complaint.getComplaintNumber(),
                complaint.getPanchayatId(),
                panchayatName,
                complaint.getCitizenId(),
                citizen != null ? citizen.getFullName() : null,
                citizen != null ? citizen.getMobile() : null,
                citizen != null ? citizen.getVillage() : null,
                citizen != null ? citizen.getWardNumber() : null,
                complaint.getCategory(),
                complaint.getCategory() != null ? complaint.getCategory().getHindiLabel() : null,
                complaint.getCategory() != null ? complaint.getCategory().getEnglishLabel() : null,
                complaint.getTitle(),
                complaint.getDescription(),
                complaint.getPriority(),
                complaint.getPriority() != null ? complaint.getPriority().getHindiLabel() : null,
                complaint.getPriority() != null ? complaint.getPriority().getEnglishLabel() : null,
                complaint.getStatus(),
                complaint.getStatus() != null ? complaint.getStatus().getHindiLabel() : null,
                complaint.getStatus() != null ? complaint.getStatus().getEnglishLabel() : null,
                complaint.getAssignedTo(),
                assignedUser != null ? assignedUser.getFullName() : null,
                assignedUser != null && assignedUser.getRole() != null ? assignedUser.getRole().name() : null,
                complaint.getResolution(),
                complaint.getCreatedAt(),
                complaint.getUpdatedAt(),
                complaint.getResolvedAt()
        );
    }
}
