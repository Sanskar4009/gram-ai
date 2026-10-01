package com.gramai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gramai.auth.dto.LoginRequest;
import com.gramai.auth.security.JwtUtils;
import com.gramai.user.Role;
import com.gramai.user.User;
import com.gramai.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setupUser() {
        userRepository.deleteAll();
        User user = new User("Rameshwar Sharma", "secretary@gramai.in", "9876543211",
                passwordEncoder.encode("SecretPassword@123"), Role.SECRETARY, 1L);
        userRepository.save(user);
    }

    @Test
    @DisplayName("POST /api/v1/auth/login with valid credentials should return 200 and JWT token")
    void testLoginSuccess() throws Exception {
        LoginRequest request = new LoginRequest("secretary@gramai.in", "SecretPassword@123");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", not(emptyOrNullString())))
                .andExpect(jsonPath("$.user.email", is("secretary@gramai.in")))
                .andExpect(jsonPath("$.user.role", is("SECRETARY")))
                .andExpect(jsonPath("$.user.password").doesNotExist())
                .andExpect(jsonPath("$.user.passwordHash").doesNotExist());
    }

    @Test
    @DisplayName("POST /api/v1/auth/login with invalid password should return 401 with generic message")
    void testLoginInvalidPassword() throws Exception {
        LoginRequest request = new LoginRequest("secretary@gramai.in", "WrongPassword");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)))
                .andExpect(jsonPath("$.message", is("Invalid email or password")));
    }

    @Test
    @DisplayName("GET /api/v1/auth/me without token should return 401 Authentication required")
    void testGetMeWithoutToken() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)))
                .andExpect(jsonPath("$.message", is("Authentication required")));
    }

    @Test
    @DisplayName("GET /api/v1/auth/me with valid Bearer token should return 200 and user profile")
    void testGetMeWithValidToken() throws Exception {
        User user = userRepository.findByEmail("secretary@gramai.in").orElseThrow();
        String token = jwtUtils.generateToken(user.getId(), user.getEmail(), user.getRole().name(), user.getPanchayatId());

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", is("secretary@gramai.in")))
                .andExpect(jsonPath("$.role", is("SECRETARY")))
                .andExpect(jsonPath("$.fullName", is("Rameshwar Sharma")))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }
}
