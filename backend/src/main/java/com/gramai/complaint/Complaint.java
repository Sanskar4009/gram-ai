package com.gramai.complaint;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Entity representing a grievance/complaint filed in a Gram Panchayat.
 *
 * <p>Every complaint is tied to an administrative Panchayat tenant and references a registered
 * village resident from the Citizen Registry. Status transitions are strictly governed by the
 * business state machine defined in {@link ComplaintStatus}.</p>
 */
@Entity
@Table(
        name = "complaints",
        indexes = {
                @Index(name = "idx_complaint_panchayat_id", columnList = "panchayat_id"),
                @Index(name = "idx_complaint_number", columnList = "complaint_number", unique = true),
                @Index(name = "idx_complaint_status", columnList = "status"),
                @Index(name = "idx_complaint_category", columnList = "category"),
                @Index(name = "idx_complaint_priority", columnList = "priority"),
                @Index(name = "idx_complaint_citizen_id", columnList = "citizen_id"),
                @Index(name = "idx_complaint_assigned_to", columnList = "assigned_to"),
                @Index(name = "idx_complaint_created_at", columnList = "created_at"),
                @Index(name = "idx_complaint_panchayat_status", columnList = "panchayat_id, status"),
                @Index(name = "idx_complaint_panchayat_created", columnList = "panchayat_id, created_at")
        }
)
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "complaint_number", nullable = false, unique = true, length = 50)
    private String complaintNumber;

    @Column(name = "panchayat_id", nullable = false)
    private Long panchayatId;

    @Column(name = "citizen_id", nullable = false)
    private Long citizenId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ComplaintCategory category;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ComplaintPriority priority = ComplaintPriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ComplaintStatus status = ComplaintStatus.OPEN;

    @Column(name = "assigned_to")
    private Long assignedTo;

    @Column(columnDefinition = "TEXT")
    private String resolution;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    public Complaint() {}

    public Complaint(
            String complaintNumber,
            Long panchayatId,
            Long citizenId,
            ComplaintCategory category,
            String title,
            String description,
            ComplaintPriority priority,
            Long assignedTo
    ) {
        this.complaintNumber = complaintNumber;
        this.panchayatId = panchayatId;
        this.citizenId = citizenId;
        this.category = category;
        this.title = title;
        this.description = description;
        this.priority = priority != null ? priority : ComplaintPriority.MEDIUM;
        this.status = ComplaintStatus.OPEN;
        this.assignedTo = assignedTo;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        if (this.priority == null) {
            this.priority = ComplaintPriority.MEDIUM;
        }
        if (this.status == null) {
            this.status = ComplaintStatus.OPEN;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getComplaintNumber() {
        return complaintNumber;
    }

    public void setComplaintNumber(String complaintNumber) {
        this.complaintNumber = complaintNumber;
    }

    public Long getPanchayatId() {
        return panchayatId;
    }

    public void setPanchayatId(Long panchayatId) {
        this.panchayatId = panchayatId;
    }

    public Long getCitizenId() {
        return citizenId;
    }

    public void setCitizenId(Long citizenId) {
        this.citizenId = citizenId;
    }

    public ComplaintCategory getCategory() {
        return category;
    }

    public void setCategory(ComplaintCategory category) {
        this.category = category;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public ComplaintPriority getPriority() {
        return priority;
    }

    public void setPriority(ComplaintPriority priority) {
        this.priority = priority;
    }

    public ComplaintStatus getStatus() {
        return status;
    }

    public void setStatus(ComplaintStatus status) {
        this.status = status;
    }

    public Long getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(Long assignedTo) {
        this.assignedTo = assignedTo;
    }

    public String getResolution() {
        return resolution;
    }

    public void setResolution(String resolution) {
        this.resolution = resolution;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Instant getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(Instant resolvedAt) {
        this.resolvedAt = resolvedAt;
    }
}
