package com.gramai;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;

class PasswordSecurityTest {

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder(12);

    @Test
    @DisplayName("BCrypt password hashing should produce valid salted hashes and match correctly")
    void testPasswordHashingAndMatching() {
        String rawPassword = "SecurePassword@123";

        String hash1 = passwordEncoder.encode(rawPassword);
        String hash2 = passwordEncoder.encode(rawPassword);

        // Hashes should never be identical due to unique salting
        assertThat(hash1).isNotEqualTo(hash2);

        // Hashes should never equal raw password
        assertThat(hash1).isNotEqualTo(rawPassword);

        // Verify BCrypt match
        assertThat(passwordEncoder.matches(rawPassword, hash1)).isTrue();
        assertThat(passwordEncoder.matches(rawPassword, hash2)).isTrue();

        // Verify wrong password fails
        assertThat(passwordEncoder.matches("WrongPassword@123", hash1)).isFalse();
    }
}
