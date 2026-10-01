package com.gramai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gramai.auth.security.JwtUtils;
import com.gramai.panchayat.Panchayat;
import com.gramai.panchayat.PanchayatRepository;
import com.gramai.user.Role;
import com.gramai.user.User;
import com.gramai.user.UserRepository;
import com.gramai.user.dto.CreateUserRequest;
import com.gramai.user.dto.UpdateUserRequest;
import com.gramai.user.dto.UpdateUserStatusRequest;
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
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PanchayatRepository panchayatRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private ObjectMapper objectMapper;

    private String adminToken;
    private String secretaryToken;
    private Panchayat testPanchayat;
    private User adminUser;
    private User secretaryUser;

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

        adminUser = new User("System Admin", "admin@gramai.in", "9876543210",
                passwordEncoder.encode("Admin@123"), Role.ADMIN, null);
        adminUser = userRepository.save(adminUser);
        adminToken = jwtUtils.generateToken(adminUser.getId(), adminUser.getEmail(), adminUser.getRole().name(), null);

        secretaryUser = new User("Rameshwar Sachiv", "secretary@gramai.in", "9876543211",
                passwordEncoder.encode("Secretary@123"), Role.SECRETARY, testPanchayat.getId());
        secretaryUser = userRepository.save(secretaryUser);
        secretaryToken = jwtUtils.generateToken(secretaryUser.getId(), secretaryUser.getEmail(), secretaryUser.getRole().name(), testPanchayat.getId());
    }

    @Test
    @DisplayName("ADMIN can create user with temporary password and passwordHash is never returned")
    void testAdminCreateUserSuccess() throws Exception {
        CreateUserRequest request = new CreateUserRequest(
                "Sunil GRS",
                "sunil.grs@gramai.in",
                "9876543220",
                "TempPass@123",
                Role.GRS,
                testPanchayat.getId()
        );

        mockMvc.perform(post("/api/v1/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.fullName", is("Sunil GRS")))
                .andExpect(jsonPath("$.email", is("sunil.grs@gramai.in")))
                .andExpect(jsonPath("$.role", is("GRS")))
                .andExpect(jsonPath("$.panchayatId", is(testPanchayat.getId().intValue())))
                .andExpect(jsonPath("$.panchayatName", is("Rampur Gram Panchayat")))
                .andExpect(jsonPath("$.active", is(true)))
                // Verify password / passwordHash is NEVER exposed
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    @DisplayName("Duplicate email is rejected with 409 Conflict")
    void testDuplicateEmailRejected() throws Exception {
        CreateUserRequest request = new CreateUserRequest(
                "Another Admin",
                "admin@gramai.in", // Existing email
                "9876543299",
                "TempPass@123",
                Role.ADMIN,
                null
        );

        mockMvc.perform(post("/api/v1/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status", is(409)))
                .andExpect(jsonPath("$.message", containsString("admin@gramai.in")));
    }

    @Test
    @DisplayName("User creation validation returns 400 Bad Request with field errors map")
    void testUserValidationErrors() throws Exception {
        CreateUserRequest invalid = new CreateUserRequest(
                "",
                "not-an-email",
                "123", // Invalid phone (needs 10 digits)
                "short", // min 6 chars
                null,
                null
        );

        mockMvc.perform(post("/api/v1/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.message", is("Validation failed")))
                .andExpect(jsonPath("$.errors.fullName", notNullValue()))
                .andExpect(jsonPath("$.errors.email", notNullValue()))
                .andExpect(jsonPath("$.errors.mobile", notNullValue()))
                .andExpect(jsonPath("$.errors.password", notNullValue()))
                .andExpect(jsonPath("$.errors.role", notNullValue()));
    }

    @Test
    @DisplayName("SECRETARY can create permitted user (e.g. CITIZEN) in own Panchayat")
    void testSecretaryCanCreateCitizenInOwnPanchayat() throws Exception {
        CreateUserRequest request = new CreateUserRequest(
                "Ramcharan Yadav",
                "citizen.ramcharan@gramai.in",
                "9876543230",
                "TempPass@123",
                Role.CITIZEN,
                testPanchayat.getId()
        );

        mockMvc.perform(post("/api/v1/users")
                        .header("Authorization", "Bearer " + secretaryToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.fullName", is("Ramcharan Yadav")))
                .andExpect(jsonPath("$.role", is("CITIZEN")))
                .andExpect(jsonPath("$.panchayatId", is(testPanchayat.getId().intValue())));
    }

    @Test
    @DisplayName("GET /api/v1/users returns paginated users list and supports search")
    void testGetUsersWithPaginationAndSearch() throws Exception {
        mockMvc.perform(get("/api/v1/users?page=0&size=10")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.page", is(0)))
                .andExpect(jsonPath("$.size", is(10)))
                .andExpect(jsonPath("$.totalElements", is(2)));

        mockMvc.perform(get("/api/v1/users?search=Sachiv")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].email", is("secretary@gramai.in")));
    }

    @Test
    @DisplayName("ADMIN can update user information")
    void testUpdateUser() throws Exception {
        UpdateUserRequest updateRequest = new UpdateUserRequest(
                "Rameshwar Sharma Sachiv",
                "secretary.updated@gramai.in",
                "9876543211",
                Role.SECRETARY,
                testPanchayat.getId()
        );

        mockMvc.perform(put("/api/v1/users/" + secretaryUser.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName", is("Rameshwar Sharma Sachiv")))
                .andExpect(jsonPath("$.email", is("secretary.updated@gramai.in")));
    }

    @Test
    @DisplayName("ADMIN can toggle user active status via PATCH")
    void testUpdateUserStatus() throws Exception {
        UpdateUserStatusRequest statusRequest = new UpdateUserStatusRequest(false);

        mockMvc.perform(patch("/api/v1/users/" + secretaryUser.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active", is(false)));

        User reloaded = userRepository.findById(secretaryUser.getId()).orElseThrow();
        assertFalse(reloaded.isActive());
    }

    @Test
    @DisplayName("User cannot deactivate their own account")
    void testCannotDeactivateSelf() throws Exception {
        UpdateUserStatusRequest statusRequest = new UpdateUserStatusRequest(false);

        mockMvc.perform(patch("/api/v1/users/" + adminUser.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusRequest)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)))
                .andExpect(jsonPath("$.message", containsString("cannot deactivate your own account")));
    }
}
