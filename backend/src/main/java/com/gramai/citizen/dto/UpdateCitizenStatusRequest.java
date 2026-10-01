package com.gramai.citizen.dto;

import com.gramai.citizen.CitizenStatus;

public record UpdateCitizenStatusRequest(
        CitizenStatus status,
        Boolean active
) {
    public CitizenStatus resolvedStatus() {
        if (status != null) {
            return status;
        }
        if (active != null) {
            return active ? CitizenStatus.ACTIVE : CitizenStatus.INACTIVE;
        }
        throw new IllegalArgumentException("Either 'status' (ACTIVE/INACTIVE) or 'active' (true/false) must be provided.");
    }
}
