package com.gramai;

import com.gramai.auth.security.JwtUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class JwtUtilsTest {

    private JwtUtils jwtUtils;
    private final String secretKey = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970337336763979244226452948404D635166546A576E5A7234753778214125442A";

    @BeforeEach
    void setUp() {
        jwtUtils = new JwtUtils();
        ReflectionTestUtils.setField(jwtUtils, "jwtSecret", secretKey);
        ReflectionTestUtils.setField(jwtUtils, "jwtExpirationMs", 3600000L); // 1 hour
    }

    @Test
    @DisplayName("Should generate valid JWT with user identity and claims")
    void testTokenGenerationAndValidation() {
        String token = jwtUtils.generateToken(42L, "secretary@gramai.in", "SECRETARY", 101L);

        assertThat(token).isNotBlank();
        assertThat(jwtUtils.validateToken(token)).isTrue();
        assertThat(jwtUtils.getUserIdFromToken(token)).isEqualTo(42L);
        assertThat(jwtUtils.getEmailFromToken(token)).isEqualTo("secretary@gramai.in");
        assertThat(jwtUtils.getRoleFromToken(token)).isEqualTo("SECRETARY");
        assertThat(jwtUtils.getPanchayatIdFromToken(token)).isEqualTo(101L);
    }

    @Test
    @DisplayName("Should reject expired JWT")
    void testExpiredTokenValidation() {
        // Configure negative expiration
        ReflectionTestUtils.setField(jwtUtils, "jwtExpirationMs", -1000L);
        String expiredToken = jwtUtils.generateToken(1L, "user@gramai.in", "CITIZEN", 1L);

        assertThat(jwtUtils.validateToken(expiredToken)).isFalse();
    }

    @Test
    @DisplayName("Should reject malformed or tampered JWT")
    void testMalformedTokenValidation() {
        assertThat(jwtUtils.validateToken("not.a.valid.jwt.token")).isFalse();
        assertThat(jwtUtils.validateToken("")).isFalse();
    }
}
