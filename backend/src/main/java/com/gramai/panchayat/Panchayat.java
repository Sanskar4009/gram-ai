package com.gramai.panchayat;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Entity representing a Gram Panchayat administrative unit.
 *
 * <p>The {@code active} field enables safe soft-deactivation.
 * Physical deletion of a Panchayat would orphan users, citizens, complaints,
 * and financial ledger records, violating regulatory and audit requirements.
 * Instead, deactivating a Panchayat marks {@code active = false} while
 * fully preserving historical records and relational integrity.</p>
 */
@Entity
@Table(name = "panchayats")
public class Panchayat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 100)
    private String district;

    @Column(nullable = false, length = 100)
    private String block;

    @Column(nullable = false, length = 100)
    private String state;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Panchayat() {}

    public Panchayat(String name, String code, String district, String block, String state) {
        this.name = name;
        this.code = code;
        this.district = district;
        this.block = block;
        this.state = state;
        this.active = true;
    }

    public Panchayat(String name, String code, String district, String block, String state, boolean active) {
        this.name = name;
        this.code = code;
        this.district = district;
        this.block = block;
        this.state = state;
        this.active = active;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }

    public String getBlock() {
        return block;
    }

    public void setBlock(String block) {
        this.block = block;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
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
