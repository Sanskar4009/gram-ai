package com.gramai.complaint;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Audit and activity history entry for a complaint lifecycle event.
 *
 * <p>Tracks key milestones (creation, assignment, status transition, resolution, closure)
 * providing transparency and preparation for full system auditing in Milestone 11.</p>
 */
@Entity
@Table(
        name = "complaint_history",
        indexes = {
                @Index(name = "idx_complaint_history_complaint_id", columnList = "complaint_id, created_at")
        }
)
public class ComplaintHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "complaint_id", nullable = false)
    private Long complaintId;

    @Column(nullable = false, length = 50)
    private String action;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 30)
    private ComplaintStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", length = 30)
    private ComplaintStatus toStatus;

    @Column(name = "performed_by")
    private Long performedBy;

    @Column(name = "performed_by_name", length = 150)
    private String performedByName;

    @Column(name = "performed_by_role", length = 50)
    private String performedByRole;

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public ComplaintHistory() {}

    public ComplaintHistory(
            Long complaintId,
            String action,
            ComplaintStatus fromStatus,
            ComplaintStatus toStatus,
            Long performedBy,
            String performedByName,
            String performedByRole,
            String details
    ) {
        this.complaintId = complaintId;
        this.action = action;
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
        this.performedBy = performedBy;
        this.performedByName = performedByName;
        this.performedByRole = performedByRole;
        this.details = details;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getComplaintId() {
        return complaintId;
    }

    public void setComplaintId(Long complaintId) {
        this.complaintId = complaintId;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public ComplaintStatus getFromStatus() {
        return fromStatus;
    }

    public void setFromStatus(ComplaintStatus fromStatus) {
        this.fromStatus = fromStatus;
    }

    public ComplaintStatus getToStatus() {
        return toStatus;
    }

    public void setToStatus(ComplaintStatus toStatus) {
        this.toStatus = toStatus;
    }

    public Long getPerformedBy() {
        return performedBy;
    }

    public void setPerformedBy(Long performedBy) {
        this.performedBy = performedBy;
    }

    public String getPerformedByName() {
        return performedByName;
    }

    public void setPerformedByName(String performedByName) {
        this.performedByName = performedByName;
    }

    public String getPerformedByRole() {
        return performedByRole;
    }

    public void setPerformedByRole(String performedByRole) {
        this.performedByRole = performedByRole;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
