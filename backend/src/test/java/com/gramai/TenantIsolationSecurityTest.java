package com.gramai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gramai.auth.security.JwtUtils;
import com.gramai.panchayat.Panchayat;
import com.gramai.panchayat.PanchayatRepository;
import com.gramai.panchayat.dto.CreatePanchayatRequest;
import com.gramai.panchayat.dto.UpdatePanchayatRequest;
import com.gramai.user.Role;
import com.gramai.user.User;
import com.gramai.user.UserRepository;
import com.gramai.user.dto.CreateUserRequest;
import com.gramai.user.dto.UpdateUserRequest;
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

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TenantIsolationSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PanchayatRepository panchayatRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private ObjectMapper objectMapper;

    private Panchayat panchayat1;
    private Panchayat panchayat2;

    private User secretaryP1;
    private String secretaryTokenP1;

    private User userP2;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        panchayatRepository.deleteAll();

        panchayat1 = panchayatRepository.save(new Panchayat(
                "Panchayat One", "P1_CODE", "District 1", "Block 1", "State 1"
        ));

        panchayat2 = panchayatRepository.save(new Panchayat(
                "Panchayat Two", "P2_CODE", "District 2", "Block 2", "State 2"
        ));

        secretaryP1 = new User(
                "Secretary One", "sec1@gramai.in", "9876543201",
                passwordEncoder.encode("Secret@123"), Role.SECRETARY, panchayat1.getId()
        );
        secretaryP1 = userRepository.save(secretaryP1);
        secretaryTokenP1 = jwtUtils.generateToken(
                secretaryP1.getId(), secretaryP1.getEmail(), secretaryP1.getRole().name(), panchayat1.getId()
        );

        userP2 = new User(
                "Citizen Two", "cit2@gramai.in", "9876543202",
                passwordEncoder.encode("Secret@123"), Role.CITIZEN, panchayat2.getId()
        );
        userP2 = userRepository.save(userP2);
    }

    @Test
    @DisplayName("SECRETARY can access their own Panchayat (Panchayat 1) -> 200 OK")
    void testSecretaryCanAccessOwnPanchayat() throws Exception {
        mockMvc.perform(get("/api/v1/panchayats/" + panchayat1.getId())
                        .header("Authorization", "Bearer " + secretaryTokenP1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(panchayat1.getId().intValue())))
                .andExpect(jsonPath("$.name", is("Panchayat One")));
    }

    @Test
    @DisplayName("SECRETARY accessing another Panchayat (Panchayat 2) via URL manipulation -> 403 Forbidden")
    void testSecretaryCannotAccessOtherPanchayat() throws Exception {
        mockMvc.perform(get("/api/v1/panchayats/" + panchayat2.getId())
                        .header("Authorization", "Bearer " + secretaryTokenP1))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)))
                .andExpect(jsonPath("$.message", is("Access denied: You do not have permission to access data from another Panchayat.")));
    }

    @Test
    @DisplayName("SECRETARY cannot create a Panchayat -> 403 Forbidden")
    void testSecretaryCannotCreatePanchayat() throws Exception {
        CreatePanchayatRequest request = new CreatePanchayatRequest(
                "Unauthorized GP", "UNAUTH01", "Dist", "Block", "State"
        );

        mockMvc.perform(post("/api/v1/panchayats")
                        .header("Authorization", "Bearer " + secretaryTokenP1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("SECRETARY cannot update a Panchayat -> 403 Forbidden")
    void testSecretaryCannotUpdatePanchayat() throws Exception {
        UpdatePanchayatRequest request = new UpdatePanchayatRequest(
                "Tampered GP", "P1_CODE", "Dist", "Block", "State", true
        );

        mockMvc.perform(put("/api/v1/panchayats/" + panchayat1.getId())
                        .header("Authorization", "Bearer " + secretaryTokenP1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("SECRETARY cannot deactivate a Panchayat -> 403 Forbidden")
    void testSecretaryCannotDeactivatePanchayat() throws Exception {
        mockMvc.perform(delete("/api/v1/panchayats/" + panchayat1.getId())
                        .header("Authorization", "Bearer " + secretaryTokenP1))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("SECRETARY cannot create ADMIN user -> 403 Forbidden")
    void testSecretaryCannotCreateAdminUser() throws Exception {
        CreateUserRequest request = new CreateUserRequest(
                "Escalated Admin", "rogue.admin@gramai.in", "9876543209",
                "Password@123", Role.ADMIN, panchayat1.getId()
        );

        mockMvc.perform(post("/api/v1/users")
                        .header("Authorization", "Bearer " + secretaryTokenP1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)))
                .andExpect(jsonPath("$.message", is("Access denied: Secretaries cannot create Administrator accounts.")));
    }

    @Test
    @DisplayName("SECRETARY cannot create user for another Panchayat (Panchayat 2) -> 403 Forbidden")
    void testSecretaryCannotCreateUserForOtherPanchayat() throws Exception {
        CreateUserRequest request = new CreateUserRequest(
                "Cross Citizen", "cross.citizen@gramai.in", "9876543208",
                "Password@123", Role.CITIZEN, panchayat2.getId() // Target is Panchayat 2
        );

        mockMvc.perform(post("/api/v1/users")
                        .header("Authorization", "Bearer " + secretaryTokenP1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)))
                .andExpect(jsonPath("$.message", is("Access denied: You cannot create users for another Panchayat.")));
    }

    @Test
    @DisplayName("SECRETARY querying ?panchayatId=2 to bypass isolation -> 403 Forbidden")
    void testSecretaryCannotBypassIsolationWithQueryParam() throws Exception {
        mockMvc.perform(get("/api/v1/users?panchayatId=" + panchayat2.getId())
                        .header("Authorization", "Bearer " + secretaryTokenP1))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)))
                .andExpect(jsonPath("$.message", is("Access denied: You cannot view users belonging to another Panchayat.")));
    }

    @Test
    @DisplayName("SECRETARY accessing user from another Panchayat -> 403 Forbidden")
    void testSecretaryCannotAccessUserFromOtherPanchayat() throws Exception {
        mockMvc.perform(get("/api/v1/users/" + userP2.getId())
                        .header("Authorization", "Bearer " + secretaryTokenP1))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)))
                .andExpect(jsonPath("$.message", is("Access denied: You do not have permission to view users outside your Panchayat.")));
    }

    @Test
    @DisplayName("User cannot change their own Panchayat ID -> 403 Forbidden")
    void testUserCannotChangeOwnPanchayat() throws Exception {
        UpdateUserRequest request = new UpdateUserRequest(
                "Secretary One", "sec1@gramai.in", "9876543201",
                Role.SECRETARY, panchayat2.getId() // Attempting to switch to Panchayat 2
        );

        mockMvc.perform(put("/api/v1/users/" + secretaryP1.getId())
                        .header("Authorization", "Bearer " + secretaryTokenP1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)))
                .andExpect(jsonPath("$.message", is("Users cannot change their own Panchayat.")));
    }
}
