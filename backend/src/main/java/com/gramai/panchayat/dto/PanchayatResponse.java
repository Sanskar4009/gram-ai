package com.gramai.panchayat.dto;

import com.gramai.panchayat.Panchayat;

import java.time.Instant;

public record PanchayatResponse(
        Long id,
        String name,
        String code,
        String district,
        String block,
        String state,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {
    public static PanchayatResponse from(Panchayat p) {
        return new PanchayatResponse(
                p.getId(),
                p.getName(),
                p.getCode(),
                p.getDistrict(),
                p.getBlock(),
                p.getState(),
                p.isActive(),
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }
}
