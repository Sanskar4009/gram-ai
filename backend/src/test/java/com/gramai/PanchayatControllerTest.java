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
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PanchayatControllerTest {

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

    private String adminToken;
    private Panchayat testPanchayat;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        panchayatRepository.deleteAll();

        testPanchayat = panchayatRepository.save(new Panchayat(
                "Rampur Gram Panchayat",
                "RAMPUR01",
                "Sehore",
                "Ichhawar",
                "Madhya Pradesh"
        ));

        User admin = new User("System Admin", "admin@gramai.in", "9876543210",
                passwordEncoder.encode("Admin@123"), Role.ADMIN, null);
        admin = userRepository.save(admin);
        adminToken = jwtUtils.generateToken(admin.getId(), admin.getEmail(), admin.getRole().name(), null);
    }

    @Test
    @DisplayName("ADMIN can successfully create a new Panchayat")
    void testCreatePanchayatSuccess() throws Exception {
        CreatePanchayatRequest request = new CreatePanchayatRequest(
                "Shivpuri Gram Panchayat",
                "SHIV001",
                "Shivpuri",
                "Kolaras",
                "Madhya Pradesh"
        );

        mockMvc.perform(post("/api/v1/panchayats")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.name", is("Shivpuri Gram Panchayat")))
                .andExpect(jsonPath("$.code", is("SHIV001")))
                .andExpect(jsonPath("$.district", is("Shivpuri")))
                .andExpect(jsonPath("$.active", is(true)))
                .andExpect(jsonPath("$.createdAt", notNullValue()));
    }

    @Test
    @DisplayName("Duplicate Panchayat code is rejected with 409 Conflict")
    void testDuplicatePanchayatCodeRejected() throws Exception {
        CreatePanchayatRequest request = new CreatePanchayatRequest(
                "Duplicate Rampur",
                "RAMPUR01",
                "Sehore",
                "Ichhawar",
                "Madhya Pradesh"
        );

        mockMvc.perform(post("/api/v1/panchayats")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status", is(409)))
                .andExpect(jsonPath("$.message", containsString("RAMPUR01")));
    }

    @Test
    @DisplayName("Panchayat validation returns 400 Bad Request with field errors map")
    void testValidationFailure() throws Exception {
        CreatePanchayatRequest invalidRequest = new CreatePanchayatRequest(
                "",
                "",
                "",
                "",
                ""
        );

        mockMvc.perform(post("/api/v1/panchayats")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.message", is("Validation failed")))
                .andExpect(jsonPath("$.errors.name", notNullValue()))
                .andExpect(jsonPath("$.errors.code", notNullValue()))
                .andExpect(jsonPath("$.errors.district", notNullValue()));
    }

    @Test
    @DisplayName("ADMIN can retrieve paginated list of Panchayats")
    void testGetPanchayatsPagination() throws Exception {
        mockMvc.perform(get("/api/v1/panchayats?page=0&size=10")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.page", is(0)))
                .andExpect(jsonPath("$.size", is(10)))
                .andExpect(jsonPath("$.totalElements", is(1)))
                .andExpect(jsonPath("$.totalPages", is(1)))
                .andExpect(jsonPath("$.content[0].name", is("Rampur Gram Panchayat")));
    }

    @Test
    @DisplayName("ADMIN can search Panchayats by keyword")
    void testSearchPanchayats() throws Exception {
        panchayatRepository.save(new Panchayat(
                "Indore Gram Panchayat",
                "IND001",
                "Indore",
                "Sanwer",
                "Madhya Pradesh"
        ));

        mockMvc.perform(get("/api/v1/panchayats?search=Indore")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].code", is("IND001")));
    }

    @Test
    @DisplayName("ADMIN can update Panchayat details")
    void testUpdatePanchayat() throws Exception {
        UpdatePanchayatRequest updateRequest = new UpdatePanchayatRequest(
                "Rampur Updated GP",
                "RAMPUR01",
                "Sehore Updated",
                "Ichhawar",
                "Madhya Pradesh",
                true
        );

        mockMvc.perform(put("/api/v1/panchayats/" + testPanchayat.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Rampur Updated GP")))
                .andExpect(jsonPath("$.district", is("Sehore Updated")));
    }

    @Test
    @DisplayName("ADMIN can safely deactivate Panchayat (soft delete)")
    void testDeactivatePanchayat() throws Exception {
        mockMvc.perform(delete("/api/v1/panchayats/" + testPanchayat.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        Panchayat updated = panchayatRepository.findById(testPanchayat.getId()).orElseThrow();
        assertFalse(updated.isActive(), "Panchayat should be marked inactive after deactivation");
    }
}
