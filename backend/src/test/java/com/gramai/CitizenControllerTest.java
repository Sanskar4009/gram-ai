package com.gramai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gramai.auth.security.JwtUtils;
import com.gramai.citizen.Citizen;
import com.gramai.citizen.CitizenRepository;
import com.gramai.citizen.CitizenStatus;
import com.gramai.citizen.dto.CreateCitizenRequest;
import com.gramai.citizen.dto.UpdateCitizenRequest;
import com.gramai.citizen.dto.UpdateCitizenStatusRequest;
import com.gramai.panchayat.Panchayat;
import com.gramai.panchayat.PanchayatRepository;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CitizenControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CitizenRepository citizenRepository;

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

    private User sarpanchP1;
    private String sarpanchTokenP1;

    private User citizenUserP1;
    private String citizenUserTokenP1;

    private User adminUser;
    private String adminToken;

    private Citizen citizenP1;
    private Citizen citizenP2;

    @BeforeEach
    void setUp() {
        citizenRepository.deleteAll();
        userRepository.deleteAll();
        panchayatRepository.deleteAll();

        panchayat1 = panchayatRepository.save(new Panchayat(
                "Rampur Gram Panchayat", "RAMPUR01", "Sehore", "Ichhawar", "Madhya Pradesh"
        ));

        panchayat2 = panchayatRepository.save(new Panchayat(
                "Sonpur Gram Panchayat", "SONPUR02", "Bhopal", "Berasia", "Madhya Pradesh"
        ));

        // Secretary in Panchayat 1
        secretaryP1 = userRepository.save(new User(
                "Secretary Rameshwar", "sec1@gramai.in", "9876543201",
                passwordEncoder.encode("Secret@123"), Role.SECRETARY, panchayat1.getId()
        ));
        secretaryTokenP1 = jwtUtils.generateToken(
                secretaryP1.getId(), secretaryP1.getEmail(), secretaryP1.getRole().name(), panchayat1.getId()
        );

        // Sarpanch in Panchayat 1
        sarpanchP1 = userRepository.save(new User(
                "Kamla Bai Sarpanch", "sarpanch1@gramai.in", "9876543202",
                passwordEncoder.encode("Secret@123"), Role.SARPANCH, panchayat1.getId()
        ));
        sarpanchTokenP1 = jwtUtils.generateToken(
                sarpanchP1.getId(), sarpanchP1.getEmail(), sarpanchP1.getRole().name(), panchayat1.getId()
        );

        // Citizen user in Panchayat 1
        citizenUserP1 = userRepository.save(new User(
                "Ramcharan Yadav", "citizen1@gramai.in", "9876543203",
                passwordEncoder.encode("Secret@123"), Role.CITIZEN, panchayat1.getId()
        ));
        citizenUserTokenP1 = jwtUtils.generateToken(
                citizenUserP1.getId(), citizenUserP1.getEmail(), citizenUserP1.getRole().name(), panchayat1.getId()
        );

        // Administrator (no panchayatId)
        adminUser = userRepository.save(new User(
                "System Admin", "admin@gramai.in", "9876543204",
                passwordEncoder.encode("Admin@123"), Role.ADMIN, null
        ));
        adminToken = jwtUtils.generateToken(
                adminUser.getId(), adminUser.getEmail(), adminUser.getRole().name(), null
        );

        // Seed initial citizen in Panchayat 1
        citizenP1 = citizenRepository.save(new Citizen(
                panchayat1.getId(), "Rameshwar Dayal", "9876500001", "Rampur", 1, "House 1, Rampur", CitizenStatus.ACTIVE
        ));

        // Seed initial citizen in Panchayat 2
        citizenP2 = citizenRepository.save(new Citizen(
                panchayat2.getId(), "Dharmendra Verma", "9876500002", "Sonpur", 2, "Main Road, Sonpur", CitizenStatus.ACTIVE
        ));
    }

    @Test
    @DisplayName("SECRETARY can create a citizen in their own Panchayat -> 201 Created")
    void testSecretaryCreateCitizenSuccess() throws Exception {
        CreateCitizenRequest request = new CreateCitizenRequest(
                "Sita Devi", "9876511111", "Rampur", 1, "House 12, Ward 1", null
        );

        mockMvc.perform(post("/api/v1/citizens")
                        .header("Authorization", "Bearer " + secretaryTokenP1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.fullName", is("Sita Devi")))
                .andExpect(jsonPath("$.mobile", is("9876511111")))
                .andExpect(jsonPath("$.village", is("Rampur")))
                .andExpect(jsonPath("$.wardNumber", is(1)))
                .andExpect(jsonPath("$.address", is("House 12, Ward 1")))
                .andExpect(jsonPath("$.status", is("ACTIVE")))
                .andExpect(jsonPath("$.panchayatId", is(panchayat1.getId().intValue())))
                .andExpect(jsonPath("$.panchayatName", is("Rampur Gram Panchayat")));
    }

    @Test
    @DisplayName("Hindi Unicode names are fully supported -> 201 Created")
    void testHindiNameSupport() throws Exception {
        CreateCitizenRequest request = new CreateCitizenRequest(
                "कमला बाई", "9876522222", "हर्राभाट", 3, "बस्ती रोड, वार्ड ३", null
        );

        mockMvc.perform(post("/api/v1/citizens")
                        .header("Authorization", "Bearer " + secretaryTokenP1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.fullName", is("कमला बाई")))
                .andExpect(jsonPath("$.village", is("हर्राभाट")))
                .andExpect(jsonPath("$.wardNumber", is(3)));
    }

    @Test
    @DisplayName("Validation failure on blank name or missing wardNumber -> 400 Bad Request")
    void testValidationFailure() throws Exception {
        CreateCitizenRequest invalidRequest = new CreateCitizenRequest(
                "", "9876511111", "", null, null, null
        );

        mockMvc.perform(post("/api/v1/citizens")
                        .header("Authorization", "Bearer " + secretaryTokenP1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.errors.fullName", notNullValue()))
                .andExpect(jsonPath("$.errors.village", notNullValue()))
                .andExpect(jsonPath("$.errors.wardNumber", notNullValue()));
    }

    @Test
    @DisplayName("Optional mobile number can be empty or null -> 201 Created")
    void testOptionalMobileNumber() throws Exception {
        CreateCitizenRequest request = new CreateCitizenRequest(
                "Sundar Lal", null, "Rampur", 2, "Near River", null
        );

        mockMvc.perform(post("/api/v1/citizens")
                        .header("Authorization", "Bearer " + secretaryTokenP1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.fullName", is("Sundar Lal")))
                .andExpect(jsonPath("$.mobile", nullValue()));
    }

    @Test
    @DisplayName("Duplicate names and shared family mobiles are allowed without 409 conflict")
    void testDuplicateNameAndMobileAllowed() throws Exception {
        // Register brother/family member sharing the exact same mobile number
        CreateCitizenRequest request = new CreateCitizenRequest(
                "Rameshwar Dayal Junior", "9876500001", "Rampur", 1, "House 1, Rampur", null
        );

        mockMvc.perform(post("/api/v1/citizens")
                        .header("Authorization", "Bearer " + secretaryTokenP1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.mobile", is("9876500001")));
    }

    @Test
    @DisplayName("SECRETARY can retrieve citizen in own Panchayat -> 200 OK")
    void testGetCitizenByIdOwnPanchayat() throws Exception {
        mockMvc.perform(get("/api/v1/citizens/" + citizenP1.getId())
                        .header("Authorization", "Bearer " + secretaryTokenP1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(citizenP1.getId().intValue())))
                .andExpect(jsonPath("$.fullName", is("Rameshwar Dayal")))
                .andExpect(jsonPath("$.panchayatId", is(panchayat1.getId().intValue())));
    }

    @Test
    @DisplayName("SECRETARY accessing another Panchayat's citizen -> 403 Forbidden")
    void testSecretaryCrossPanchayatAccessDenied() throws Exception {
        mockMvc.perform(get("/api/v1/citizens/" + citizenP2.getId())
                        .header("Authorization", "Bearer " + secretaryTokenP1))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)))
                .andExpect(jsonPath("$.message", is("Access denied: You do not have permission to view citizens outside your Panchayat.")));
    }

    @Test
    @DisplayName("SECRETARY cannot create citizen for another Panchayat -> 403 Forbidden")
    void testSecretaryCannotCreateForOtherPanchayat() throws Exception {
        CreateCitizenRequest request = new CreateCitizenRequest(
                "Unauthorized Citizen", "9876599999", "Sonpur", 2, "Street 1", panchayat2.getId()
        );

        mockMvc.perform(post("/api/v1/citizens")
                        .header("Authorization", "Bearer " + secretaryTokenP1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)))
                .andExpect(jsonPath("$.message", is("Access denied: You cannot create citizens for another Panchayat.")));
    }

    @Test
    @DisplayName("SECRETARY querying ?panchayatId={other} to bypass isolation -> 403 Forbidden")
    void testSecretaryQueryParamBypassRejected() throws Exception {
        mockMvc.perform(get("/api/v1/citizens?panchayatId=" + panchayat2.getId())
                        .header("Authorization", "Bearer " + secretaryTokenP1))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)))
                .andExpect(jsonPath("$.message", is("Access denied: You cannot view citizens belonging to another Panchayat.")));
    }

    @Test
    @DisplayName("CITIZEN role is rejected from viewing the citizen registry -> 403 Forbidden")
    void testCitizenRoleCannotViewRegistry() throws Exception {
        mockMvc.perform(get("/api/v1/citizens")
                        .header("Authorization", "Bearer " + citizenUserTokenP1))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)));

        mockMvc.perform(get("/api/v1/citizens/" + citizenP1.getId())
                        .header("Authorization", "Bearer " + citizenUserTokenP1))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)));
    }

    @Test
    @DisplayName("SARPANCH can view citizens in own Panchayat -> 200 OK")
    void testSarpanchCanViewOwnPanchayatCitizens() throws Exception {
        mockMvc.perform(get("/api/v1/citizens")
                        .header("Authorization", "Bearer " + sarpanchTokenP1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].fullName", is("Rameshwar Dayal")));
    }

    @Test
    @DisplayName("SARPANCH cannot create citizen -> 403 Forbidden")
    void testSarpanchCannotCreateCitizen() throws Exception {
        CreateCitizenRequest request = new CreateCitizenRequest(
                "Sarpanch Add", "9876533333", "Rampur", 1, "Address", null
        );

        mockMvc.perform(post("/api/v1/citizens")
                        .header("Authorization", "Bearer " + sarpanchTokenP1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("SECRETARY can update a citizen in own Panchayat -> 200 OK")
    void testUpdateCitizenSuccess() throws Exception {
        UpdateCitizenRequest request = new UpdateCitizenRequest(
                "Rameshwar Dayal Updated", "9876500001", "Rampur Khas", 1, "New Address 55", null
        );

        mockMvc.perform(put("/api/v1/citizens/" + citizenP1.getId())
                        .header("Authorization", "Bearer " + secretaryTokenP1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName", is("Rameshwar Dayal Updated")))
                .andExpect(jsonPath("$.village", is("Rampur Khas")))
                .andExpect(jsonPath("$.address", is("New Address 55")));
    }

    @Test
    @DisplayName("SECRETARY cannot change a citizen's Panchayat ID -> 403 Forbidden")
    void testCannotChangeCitizenPanchayat() throws Exception {
        UpdateCitizenRequest request = new UpdateCitizenRequest(
                "Rameshwar Dayal", "9876500001", "Rampur", 1, "Address", panchayat2.getId()
        );

        mockMvc.perform(put("/api/v1/citizens/" + citizenP1.getId())
                        .header("Authorization", "Bearer " + secretaryTokenP1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)))
                .andExpect(jsonPath("$.message", is("Access denied: You cannot change a citizen's Panchayat.")));
    }

    @Test
    @DisplayName("SECRETARY can update citizen status (ACTIVE -> INACTIVE) -> 200 OK")
    void testUpdateCitizenStatus() throws Exception {
        UpdateCitizenStatusRequest request = new UpdateCitizenStatusRequest(CitizenStatus.INACTIVE, null);

        mockMvc.perform(patch("/api/v1/citizens/" + citizenP1.getId() + "/status")
                        .header("Authorization", "Bearer " + secretaryTokenP1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("INACTIVE")));
    }

    @Test
    @DisplayName("Search citizens by name, mobile, and village works and is scoped")
    void testCitizenSearch() throws Exception {
        // Add additional citizen
        citizenRepository.save(new Citizen(
                panchayat1.getId(), "Rajesh Kumar Patel", "9876500003", "Harrabhat", 2, "Address 2", CitizenStatus.ACTIVE
        ));

        // Search by name "Rajesh"
        mockMvc.perform(get("/api/v1/citizens?search=Rajesh")
                        .header("Authorization", "Bearer " + secretaryTokenP1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].fullName", is("Rajesh Kumar Patel")));

        // Search by mobile "9876500003"
        mockMvc.perform(get("/api/v1/citizens?search=9876500003")
                        .header("Authorization", "Bearer " + secretaryTokenP1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].fullName", is("Rajesh Kumar Patel")));

        // Search by village "Harrabhat"
        mockMvc.perform(get("/api/v1/citizens?search=Harrabhat")
                        .header("Authorization", "Bearer " + secretaryTokenP1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].village", is("Harrabhat")));
    }

    @Test
    @DisplayName("Filtering by village, wardNumber, and status works properly")
    void testCitizenFiltering() throws Exception {
        citizenRepository.save(new Citizen(
                panchayat1.getId(), "Rajesh Kumar Patel", "9876500003", "Harrabhat", 2, "Address 2", CitizenStatus.ACTIVE
        ));
        citizenRepository.save(new Citizen(
                panchayat1.getId(), "Geeta Bai", "9876500006", "Harrabhat", 2, "Address 3", CitizenStatus.INACTIVE
        ));

        // Filter by village
        mockMvc.perform(get("/api/v1/citizens?village=Harrabhat")
                        .header("Authorization", "Bearer " + secretaryTokenP1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)));

        // Filter by wardNumber
        mockMvc.perform(get("/api/v1/citizens?wardNumber=2")
                        .header("Authorization", "Bearer " + secretaryTokenP1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)));

        // Filter by status INACTIVE
        mockMvc.perform(get("/api/v1/citizens?status=INACTIVE")
                        .header("Authorization", "Bearer " + secretaryTokenP1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].fullName", is("Geeta Bai")));

        // Combined filter: village=Harrabhat & status=ACTIVE
        mockMvc.perform(get("/api/v1/citizens?village=Harrabhat&status=ACTIVE")
                        .header("Authorization", "Bearer " + secretaryTokenP1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].fullName", is("Rajesh Kumar Patel")));
    }

    @Test
    @DisplayName("Server-side pagination and safe sorting work correctly")
    void testPaginationAndSorting() throws Exception {
        citizenRepository.save(new Citizen(panchayat1.getId(), "Citizen A", "9876500010", "Rampur", 1, null, CitizenStatus.ACTIVE));
        citizenRepository.save(new Citizen(panchayat1.getId(), "Citizen B", "9876500011", "Rampur", 1, null, CitizenStatus.ACTIVE));
        citizenRepository.save(new Citizen(panchayat1.getId(), "Citizen C", "9876500012", "Rampur", 1, null, CitizenStatus.ACTIVE));

        mockMvc.perform(get("/api/v1/citizens?page=0&size=2&sort=fullName,asc")
                        .header("Authorization", "Bearer " + secretaryTokenP1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size", is(2)))
                .andExpect(jsonPath("$.page", is(0)))
                .andExpect(jsonPath("$.totalElements", is(4)))
                .andExpect(jsonPath("$.totalPages", is(2)))
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].fullName", is("Citizen A")))
                .andExpect(jsonPath("$.content[1].fullName", is("Citizen B")));
    }

    @Test
    @DisplayName("Admin can create citizen across Panchayats -> 201 Created")
    void testAdminCreateCitizen() throws Exception {
        CreateCitizenRequest request = new CreateCitizenRequest(
                "Admin Citizen", "9876588888", "Sonpur", 3, "Street", panchayat2.getId()
        );

        mockMvc.perform(post("/api/v1/citizens")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.panchayatId", is(panchayat2.getId().intValue())));
    }
}
