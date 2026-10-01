package com.gramai.citizen.dto;

import com.gramai.citizen.Citizen;
import com.gramai.citizen.CitizenStatus;

import java.time.Instant;

public record CitizenResponse(
        Long id,
        Long panchayatId,
        String panchayatName,
        String fullName,
        String mobile,
        String village,
        Integer wardNumber,
        String address,
        CitizenStatus status,
        Instant createdAt,
        Instant updatedAt
) {
    public static CitizenResponse from(Citizen citizen) {
        return from(citizen, null);
    }

    public static CitizenResponse from(Citizen citizen, String panchayatName) {
        return new CitizenResponse(
                citizen.getId(),
                citizen.getPanchayatId(),
                panchayatName,
                citizen.getFullName(),
                citizen.getMobile(),
                citizen.getVillage(),
                citizen.getWardNumber(),
                citizen.getAddress(),
                citizen.getStatus(),
                citizen.getCreatedAt(),
                citizen.getUpdatedAt()
        );
    }
}
