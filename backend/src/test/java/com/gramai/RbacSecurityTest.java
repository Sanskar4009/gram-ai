package com.gramai;

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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RbacSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    private String adminToken;
    private String secretaryToken;

    @BeforeEach
    void setupUsers() {
        userRepository.deleteAll();

        User admin = new User("System Admin", "admin@gramai.in", "9876543210",
                passwordEncoder.encode("Pass@123"), Role.ADMIN, null);
        admin = userRepository.save(admin);
        adminToken = jwtUtils.generateToken(admin.getId(), admin.getEmail(), admin.getRole().name(), null);

        User secretary = new User("Sachiv", "secretary@gramai.in", "9876543211",
                passwordEncoder.encode("Pass@123"), Role.SECRETARY, 1L);
        secretary = userRepository.save(secretary);
        secretaryToken = jwtUtils.generateToken(secretary.getId(), secretary.getEmail(), secretary.getRole().name(), 1L);
    }

    @Test
    @DisplayName("GET /api/v1/test/admin with ADMIN role should return 200 OK")
    void testAdminEndpointWithAdminRole() throws Exception {
        mockMvc.perform(get("/api/v1/test/admin")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.access", is("granted")))
                .andExpect(jsonPath("$.requiredRole", is("ROLE_ADMIN")));
    }

    @Test
    @DisplayName("GET /api/v1/test/admin with SECRETARY role should return 403 Forbidden with standard message")
    void testAdminEndpointWithSecretaryRole() throws Exception {
        mockMvc.perform(get("/api/v1/test/admin")
                        .header("Authorization", "Bearer " + secretaryToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)))
                .andExpect(jsonPath("$.message", is("Access denied")));
    }

    @Test
    @DisplayName("GET /api/v1/test/secretary with SECRETARY role should return 200 OK")
    void testSecretaryEndpointWithSecretaryRole() throws Exception {
        mockMvc.perform(get("/api/v1/test/secretary")
                        .header("Authorization", "Bearer " + secretaryToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.access", is("granted")))
                .andExpect(jsonPath("$.requiredRole", is("ROLE_SECRETARY")));
    }

    @Test
    @DisplayName("GET /api/v1/test/admin without token should return 401 Unauthorized")
    void testProtectedEndpointWithoutToken() throws Exception {
        mockMvc.perform(get("/api/v1/test/admin"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)))
                .andExpect(jsonPath("$.message", is("Authentication required")));
    }
}
