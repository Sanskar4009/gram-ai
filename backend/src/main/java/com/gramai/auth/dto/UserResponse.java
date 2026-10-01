package com.gramai.auth.dto;

import com.gramai.user.User;

public record UserResponse(
        Long id,
        String fullName,
        String email,
        String role,
        Long panchayatId
) {
    public static UserResponse fromUser(User user) {
        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name(),
                user.getPanchayatId()
        );
    }
}
