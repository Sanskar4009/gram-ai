package com.gramai.user.dto;

import com.gramai.user.Role;
import com.gramai.user.User;

import java.time.Instant;

public record UserResponse(
        Long id,
        String fullName,
        String email,
        String mobile,
        Role role,
        Long panchayatId,
        String panchayatName,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {
    public static UserResponse from(User user, String panchayatName) {
        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getMobile(),
                user.getRole(),
                user.getPanchayatId(),
                panchayatName,
                user.isActive(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
