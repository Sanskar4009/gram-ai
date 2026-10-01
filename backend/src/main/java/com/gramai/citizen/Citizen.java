package com.gramai.citizen;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Entity representing a village resident registered in a Gram Panchayat's Citizen Registry.
 *
 * <p>Every citizen record belongs to exactly one Panchayat (multi-tenant isolation).
 * In rural governance, physical deletion is prohibited by default because citizen records
 * are historical anchors for complaints, identity schemes, certificates, and welfare delivery.
 * Inactive citizens are preserved with {@link CitizenStatus#INACTIVE} for audit integrity.</p>
 */
@Entity
@Table(
        name = "citizens",
        indexes = {
                @Index(name = "idx_citizen_panchayat_id", columnList = "panchayat_id"),
                @Index(name = "idx_citizen_panchayat_mobile", columnList = "panchayat_id, mobile"),
                @Index(name = "idx_citizen_panchayat_status", columnList = "panchayat_id, status"),
                @Index(name = "idx_citizen_panchayat_village", columnList = "panchayat_id, village"),
                @Index(name = "idx_citizen_panchayat_ward", columnList = "panchayat_id, ward_number"),
                @Index(name = "idx_citizen_panchayat_created", columnList = "panchayat_id, created_at")
        }
)
public class Citizen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "panchayat_id", nullable = false)
    private Long panchayatId;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(length = 15)
    private String mobile;

    @Column(nullable = false, length = 100)
    private String village;

    @Column(name = "ward_number", nullable = false)
    private Integer wardNumber;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CitizenStatus status = CitizenStatus.ACTIVE;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Citizen() {}

    public Citizen(Long panchayatId, String fullName, String mobile, String village, Integer wardNumber, String address) {
        this.panchayatId = panchayatId;
        this.fullName = fullName;
        this.mobile = mobile;
        this.village = village;
        this.wardNumber = wardNumber;
        this.address = address;
        this.status = CitizenStatus.ACTIVE;
    }

    public Citizen(Long panchayatId, String fullName, String mobile, String village, Integer wardNumber, String address, CitizenStatus status) {
        this.panchayatId = panchayatId;
        this.fullName = fullName;
        this.mobile = mobile;
        this.village = village;
        this.wardNumber = wardNumber;
        this.address = address;
        this.status = status != null ? status : CitizenStatus.ACTIVE;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        if (this.status == null) {
            this.status = CitizenStatus.ACTIVE;
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

    public Long getPanchayatId() {
        return panchayatId;
    }

    public void setPanchayatId(Long panchayatId) {
        this.panchayatId = panchayatId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getMobile() {
        return mobile;
    }

    public void setMobile(String mobile) {
        this.mobile = mobile;
    }

    public String getVillage() {
        return village;
    }

    public void setVillage(String village) {
        this.village = village;
    }

    public Integer getWardNumber() {
        return wardNumber;
    }

    public void setWardNumber(Integer wardNumber) {
        this.wardNumber = wardNumber;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public CitizenStatus getStatus() {
        return status;
    }

    public void setStatus(CitizenStatus status) {
        this.status = status;
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
}
