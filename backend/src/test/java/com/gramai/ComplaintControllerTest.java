package com.gramai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gramai.auth.security.JwtUtils;
import com.gramai.citizen.Citizen;
import com.gramai.citizen.CitizenRepository;
import com.gramai.complaint.*;
import com.gramai.complaint.dto.*;
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

import java.time.LocalDate;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ComplaintControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private ComplaintHistoryRepository complaintHistoryRepository;

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

    private User adminUser;
    private String adminToken;

    private User secretaryP1;
    private String secretaryTokenP1;

    private User secretaryP2;
    private String secretaryTokenP2;

    private User grsP1;
    private String grsTokenP1;

    private User sarpanchP1;
    private String sarpanchTokenP1;

    private User citizenUserP1;
    private String citizenTokenP1;

    private Citizen citizenP1;
    private Citizen citizenP2;
    private Citizen citizenInP2;

    @BeforeEach
    void setUp() {
        complaintHistoryRepository.deleteAll();
        complaintRepository.deleteAll();
        citizenRepository.deleteAll();
        userRepository.deleteAll();
        panchayatRepository.deleteAll();

        // 1. Setup Panchayats
        panchayat1 = panchayatRepository.save(new Panchayat(
                "Rampur Gram Panchayat", "RAMPUR01", "Sehore", "Ichhawar", "Madhya Pradesh"
        ));
        panchayat2 = panchayatRepository.save(new Panchayat(
                "Sonpur Gram Panchayat", "SONPUR02", "Bhopal", "Berasia", "Madhya Pradesh"
        ));

        // 2. Setup Users
        adminUser = userRepository.save(new User(
                "System Administrator", "admin@gramai.in", "9876543200",
                passwordEncoder.encode("Admin@123"), Role.ADMIN, null
        ));
        adminToken = jwtUtils.generateToken(adminUser.getId(), adminUser.getEmail(), adminUser.getRole().name(), null);

        secretaryP1 = userRepository.save(new User(
                "Rameshwar Sharma (Sachiv)", "sec1@gramai.in", "9876543201",
                passwordEncoder.encode("Sec@123"), Role.SECRETARY, panchayat1.getId()
        ));
        secretaryTokenP1 = jwtUtils.generateToken(secretaryP1.getId(), secretaryP1.getEmail(), secretaryP1.getRole().name(), panchayat1.getId());

        secretaryP2 = userRepository.save(new User(
                "Dinesh Patel (Sachiv P2)", "sec2@gramai.in", "9876543202",
                passwordEncoder.encode("Sec@123"), Role.SECRETARY, panchayat2.getId()
        ));
        secretaryTokenP2 = jwtUtils.generateToken(secretaryP2.getId(), secretaryP2.getEmail(), secretaryP2.getRole().name(), panchayat2.getId());

        grsP1 = userRepository.save(new User(
                "Sunil Verma (GRS)", "grs1@gramai.in", "9876543203",
                passwordEncoder.encode("Grs@123"), Role.GRS, panchayat1.getId()
        ));
        grsTokenP1 = jwtUtils.generateToken(grsP1.getId(), grsP1.getEmail(), grsP1.getRole().name(), panchayat1.getId());

        sarpanchP1 = userRepository.save(new User(
                "Kamla Bai (Sarpanch)", "sarpanch1@gramai.in", "9876543204",
                passwordEncoder.encode("Sar@123"), Role.SARPANCH, panchayat1.getId()
        ));
        sarpanchTokenP1 = jwtUtils.generateToken(sarpanchP1.getId(), sarpanchP1.getEmail(), sarpanchP1.getRole().name(), panchayat1.getId());

        citizenUserP1 = userRepository.save(new User(
                "Rameshwar Dayal", "citizen1@gramai.in", "9876500001",
                passwordEncoder.encode("Cit@123"), Role.CITIZEN, panchayat1.getId()
        ));
        citizenTokenP1 = jwtUtils.generateToken(citizenUserP1.getId(), citizenUserP1.getEmail(), citizenUserP1.getRole().name(), panchayat1.getId());

        // 3. Setup Citizens
        citizenP1 = citizenRepository.save(new Citizen(
                panchayat1.getId(), "Rameshwar Dayal", "9876500001", "Rampur", 1, "Near Old Well"
        ));
        citizenP2 = citizenRepository.save(new Citizen(
                panchayat1.getId(), "Sita Devi", "9876500002", "Rampur", 1, "House 12"
        ));
        citizenInP2 = citizenRepository.save(new Citizen(
                panchayat2.getId(), "Sonpur Resident", "9876500099", "Sonpur", 1, "Main Road"
        ));
    }

    // ==========================================
    // 1. Create Complaint & 2. Number Generation
    // ==========================================
    @Test
    @DisplayName("1 & 2: Secretary can create complaint with server-side generated complaint number")
    void createComplaint_Success() throws Exception {
        CreateComplaintRequest request = new CreateComplaintRequest(
                citizenP1.getId(),
                ComplaintCategory.WATER,
                "Drinking water supply leak",
                "Main pipeline leaking near the water tank.",
                ComplaintPriority.HIGH,
                grsP1.getId(),
                null // derived server-side
        );

        int currentYear = LocalDate.now().getYear();

        mockMvc.perform(post("/api/v1/complaints")
                        .header("Authorization", "Bearer " + secretaryTokenP1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.complaintNumber", startsWith("CMP-" + currentYear + "-")))
                .andExpect(jsonPath("$.panchayatId").value(panchayat1.getId()))
                .andExpect(jsonPath("$.panchayatName").value("Rampur Gram Panchayat"))
                .andExpect(jsonPath("$.citizenId").value(citizenP1.getId()))
                .andExpect(jsonPath("$.citizenName").value("Rameshwar Dayal"))
                .andExpect(jsonPath("$.category").value("WATER"))
                .andExpect(jsonPath("$.categoryHindi").value("पेयजल"))
                .andExpect(jsonPath("$.title").value("Drinking water supply leak"))
                .andExpect(jsonPath("$.priority").value("HIGH"))
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.assignedTo").value(grsP1.getId()))
                .andExpect(jsonPath("$.assignedToName").value("Sunil Verma (GRS)"));
    }

    // ==========================================
    // 3. Get Complaint & 21. Details
    // ==========================================
    @Test
    @DisplayName("3 & 21: Authorized staff can get complaint details by ID")
    void getComplaintById_Success() throws Exception {
        Complaint complaint = complaintRepository.save(new Complaint(
                "CMP-2026-000001", panchayat1.getId(), citizenP1.getId(),
                ComplaintCategory.SANITATION, "Drainage issue", "Blockage in drain",
                ComplaintPriority.MEDIUM, grsP1.getId()
        ));

        mockMvc.perform(get("/api/v1/complaints/" + complaint.getId())
                        .header("Authorization", "Bearer " + secretaryTokenP1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(complaint.getId()))
                .andExpect(jsonPath("$.complaintNumber").value("CMP-2026-000001"))
                .andExpect(jsonPath("$.category").value("SANITATION"))
                .andExpect(jsonPath("$.title").value("Drainage issue"))
                .andExpect(jsonPath("$.status").value("OPEN"));
    }

    // ==========================================
    // 4. Update Complaint
    // ==========================================
    @Test
    @DisplayName("4: Secretary can update complaint title, description, and priority")
    void updateComplaint_Success() throws Exception {
        Complaint complaint = complaintRepository.save(new Complaint(
                "CMP-2026-000001", panchayat1.getId(), citizenP1.getId(),
                ComplaintCategory.ROAD, "Pothole repair", "Minor pothole",
                ComplaintPriority.LOW, null
        ));

        UpdateComplaintRequest updateReq = new UpdateComplaintRequest(
                null, ComplaintCategory.ROAD, "Major Pothole on Main Road",
                "Deep pothole endangering motorcycles", ComplaintPriority.URGENT, grsP1.getId()
        );

        mockMvc.perform(put("/api/v1/complaints/" + complaint.getId())
                        .header("Authorization", "Bearer " + secretaryTokenP1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Major Pothole on Main Road"))
                .andExpect(jsonPath("$.priority").value("URGENT"))
                .andExpect(jsonPath("$.assignedTo").value(grsP1.getId()));
    }

    // ==========================================
    // 5. Search Complaints
    // ==========================================
    @Test
    @DisplayName("5: Search complaints by title, complaintNumber, or citizen name")
    void searchComplaints_Success() throws Exception {
        complaintRepository.save(new Complaint(
                "CMP-2026-000101", panchayat1.getId(), citizenP1.getId(),
                ComplaintCategory.WATER, "Broken Handpump in Ward 1", "No water",
                ComplaintPriority.HIGH, null
        ));
        complaintRepository.save(new Complaint(
                "CMP-2026-000102", panchayat1.getId(), citizenP2.getId(),
                ComplaintCategory.STREET_LIGHT, "Streetlight pole failure", "Dark area",
                ComplaintPriority.MEDIUM, null
        ));

        // Search by keyword "handpump"
        mockMvc.perform(get("/api/v1/complaints?search=handpump")
                        .header("Authorization", "Bearer " + secretaryTokenP1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].title", containsString("Handpump")));

        // Search by citizen name "Sita Devi"
        mockMvc.perform(get("/api/v1/complaints?search=Sita")
                        .header("Authorization", "Bearer " + secretaryTokenP1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].citizenName").value("Sita Devi"));
    }

    // ==========================================
    // 6. Filter Complaints
    // ==========================================
    @Test
    @DisplayName("6: Filter complaints by status, category, priority, and assignedTo")
    void filterComplaints_Success() throws Exception {
        Complaint c1 = new Complaint("CMP-2026-000201", panchayat1.getId(), citizenP1.getId(),
                ComplaintCategory.WATER, "Water 1", "Desc", ComplaintPriority.HIGH, grsP1.getId());
        c1.setStatus(ComplaintStatus.IN_PROGRESS);
        complaintRepository.save(c1);

        Complaint c2 = new Complaint("CMP-2026-000202", panchayat1.getId(), citizenP2.getId(),
                ComplaintCategory.WATER, "Water 2", "Desc", ComplaintPriority.LOW, null);
        c2.setStatus(ComplaintStatus.OPEN);
        complaintRepository.save(c2);

        // Filter status=IN_PROGRESS and category=WATER
        mockMvc.perform(get("/api/v1/complaints?status=IN_PROGRESS&category=WATER")
                        .header("Authorization", "Bearer " + secretaryTokenP1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].status").value("IN_PROGRESS"));

        // Filter assignedTo=grsP1.getId()
        mockMvc.perform(get("/api/v1/complaints?assignedTo=" + grsP1.getId())
                        .header("Authorization", "Bearer " + secretaryTokenP1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].assignedTo").value(grsP1.getId()));
    }

    // ==========================================
    // 7. Pagination & 8. Safe Sorting
    // ==========================================
    @Test
    @DisplayName("7 & 8: Pagination and safe whitelisted sorting")
    void paginationAndSorting_Success() throws Exception {
        for (int i = 1; i <= 5; i++) {
            Complaint c = new Complaint(
                    String.format("CMP-2026-00030%d", i),
                    panchayat1.getId(), citizenP1.getId(),
                    ComplaintCategory.ROAD, "Road issue " + i, "Desc",
                    ComplaintPriority.MEDIUM, null
            );
            complaintRepository.save(c);
        }

        mockMvc.perform(get("/api/v1/complaints?page=0&size=2&sort=complaintNumber,asc")
                        .header("Authorization", "Bearer " + secretaryTokenP1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size").value(2))
                .andExpect(jsonPath("$.totalElements").value(5))
                .andExpect(jsonPath("$.totalPages").value(3))
                .andExpect(jsonPath("$.content[0].complaintNumber").value("CMP-2026-000301"));
    }

    // ==========================================
    // 9. Assign Complaint
    // ==========================================
    @Test
    @DisplayName("9: Secretary can assign complaint to authorized Panchayat staff member")
    void assignComplaint_Success() throws Exception {
        Complaint complaint = complaintRepository.save(new Complaint(
                "CMP-2026-000401", panchayat1.getId(), citizenP1.getId(),
                ComplaintCategory.WATER, "Motor burn", "Pump motor burned",
                ComplaintPriority.URGENT, null
        ));

        AssignComplaintRequest assignReq = new AssignComplaintRequest(grsP1.getId(), "Please inspect on site");

        mockMvc.perform(patch("/api/v1/complaints/" + complaint.getId() + "/assign")
                        .header("Authorization", "Bearer " + secretaryTokenP1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assignReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assignedTo").value(grsP1.getId()))
                .andExpect(jsonPath("$.assignedToName").value("Sunil Verma (GRS)"));
    }

    // ==========================================
    // 10. Valid Status Transitions
    // ==========================================
    @Test
    @DisplayName("10: Valid status transitions: OPEN -> IN_PROGRESS -> RESOLVED -> CLOSED")
    void validStatusTransitions_Success() throws Exception {
        Complaint complaint = complaintRepository.save(new Complaint(
                "CMP-2026-000501", panchayat1.getId(), citizenP1.getId(),
                ComplaintCategory.WATER, "Valve leak", "Leakage",
                ComplaintPriority.MEDIUM, grsP1.getId()
        ));

        // 1. OPEN -> IN_PROGRESS
        mockMvc.perform(patch("/api/v1/complaints/" + complaint.getId() + "/status")
                        .header("Authorization", "Bearer " + secretaryTokenP1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateComplaintStatusRequest(ComplaintStatus.IN_PROGRESS, null, "Work started"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));

        // 2. IN_PROGRESS -> RESOLVED
        mockMvc.perform(patch("/api/v1/complaints/" + complaint.getId() + "/resolve")
                        .header("Authorization", "Bearer " + grsTokenP1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ResolveComplaintRequest("Replaced rubber gasket and valve", null))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"))
                .andExpect(jsonPath("$.resolution").value("Replaced rubber gasket and valve"))
                .andExpect(jsonPath("$.resolvedAt").isNotEmpty());

        // 3. RESOLVED -> CLOSED
        mockMvc.perform(patch("/api/v1/complaints/" + complaint.getId() + "/close")
                        .header("Authorization", "Bearer " + secretaryTokenP1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CloseComplaintRequest("Verified on field"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"));
    }

    // ==========================================
    // 11. Invalid Status Transition
    // ==========================================
    @Test
    @DisplayName("11: Reject invalid status jump (e.g. OPEN -> CLOSED, or CLOSED -> OPEN)")
    void invalidStatusTransition_Rejected() throws Exception {
        Complaint complaint = complaintRepository.save(new Complaint(
                "CMP-2026-000601", panchayat1.getId(), citizenP1.getId(),
                ComplaintCategory.WATER, "Leak", "Desc",
                ComplaintPriority.MEDIUM, null
        ));

        // Attempt OPEN -> CLOSED directly
        mockMvc.perform(patch("/api/v1/complaints/" + complaint.getId() + "/status")
                        .header("Authorization", "Bearer " + secretaryTokenP1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateComplaintStatusRequest(ComplaintStatus.CLOSED, null, "Direct close"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Invalid status transition")));

        // Set to CLOSED and attempt CLOSED -> OPEN
        complaint.setStatus(ComplaintStatus.CLOSED);
        complaint.setResolution("Fixed");
        complaintRepository.save(complaint);

        mockMvc.perform(patch("/api/v1/complaints/" + complaint.getId() + "/status")
                        .header("Authorization", "Bearer " + secretaryTokenP1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateComplaintStatusRequest(ComplaintStatus.OPEN, null, "Reopen"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Invalid status transition")));
    }

    // ==========================================
    // 12. Resolution Requirement
    // ==========================================
    @Test
    @DisplayName("12: Marking RESOLVED without resolution note must be rejected")
    void resolveWithoutNote_Rejected() throws Exception {
        Complaint complaint = complaintRepository.save(new Complaint(
                "CMP-2026-000701", panchayat1.getId(), citizenP1.getId(),
                ComplaintCategory.WATER, "Leak", "Desc",
                ComplaintPriority.MEDIUM, grsP1.getId()
        ));
        complaint.setStatus(ComplaintStatus.IN_PROGRESS);
        complaintRepository.save(complaint);

        // Attempt resolve with blank resolution via resolve endpoint
        mockMvc.perform(patch("/api/v1/complaints/" + complaint.getId() + "/resolve")
                        .header("Authorization", "Bearer " + secretaryTokenP1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ResolveComplaintRequest("   ", null))))
                .andExpect(status().isBadRequest());

        // Attempt status PATCH to RESOLVED with empty note
        mockMvc.perform(patch("/api/v1/complaints/" + complaint.getId() + "/status")
                        .header("Authorization", "Bearer " + secretaryTokenP1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateComplaintStatusRequest(ComplaintStatus.RESOLVED, "", null))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Resolution note is required")));
    }

    // ==========================================
    // 13. Closing Requirement
    // ==========================================
    @Test
    @DisplayName("13: Closing complaint without resolution must be rejected")
    void closeWithoutResolution_Rejected() throws Exception {
        Complaint complaint = complaintRepository.save(new Complaint(
                "CMP-2026-000801", panchayat1.getId(), citizenP1.getId(),
                ComplaintCategory.WATER, "Leak", "Desc",
                ComplaintPriority.MEDIUM, null
        ));
        // status is OPEN, not RESOLVED
        mockMvc.perform(patch("/api/v1/complaints/" + complaint.getId() + "/close")
                        .header("Authorization", "Bearer " + secretaryTokenP1))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Complaint must be in RESOLVED status")));
    }

    // ==========================================
    // 14. Cross-Panchayat Access Rejection (Isolation)
    // ==========================================
    @Test
    @DisplayName("14: User from Panchayat A cannot access complaint from Panchayat B")
    void crossPanchayatComplaint_Rejected() throws Exception {
        Complaint complaintP2 = complaintRepository.save(new Complaint(
                "CMP-2026-000901", panchayat2.getId(), citizenInP2.getId(),
                ComplaintCategory.WATER, "P2 Leak", "Desc",
                ComplaintPriority.MEDIUM, null
        ));

        // Secretary from P1 attempts to access P2's complaint
        mockMvc.perform(get("/api/v1/complaints/" + complaintP2.getId())
                        .header("Authorization", "Bearer " + secretaryTokenP1))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", containsString("outside your Panchayat")));

        // Secretary from P1 attempts to update P2's complaint
        mockMvc.perform(put("/api/v1/complaints/" + complaintP2.getId())
                        .header("Authorization", "Bearer " + secretaryTokenP1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateComplaintRequest(null, null, "Hacked", null, null, null))))
                .andExpect(status().isForbidden());
    }

    // ==========================================
    // 15. Cross-Panchayat Citizen Rejection
    // ==========================================
    @Test
    @DisplayName("15: Reject creating complaint referencing citizen from another Panchayat")
    void crossPanchayatCitizen_Rejected() throws Exception {
        // Secretary in P1 tries to create complaint with citizen from P2
        CreateComplaintRequest request = new CreateComplaintRequest(
                citizenInP2.getId(),
                ComplaintCategory.WATER,
                "Cross GP Complaint",
                "Description",
                ComplaintPriority.HIGH,
                null,
                null
        );

        mockMvc.perform(post("/api/v1/complaints")
                        .header("Authorization", "Bearer " + secretaryTokenP1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", containsString("Citizen does not belong")));
    }

    // ==========================================
    // 16. Cross-Panchayat Assignee Rejection
    // ==========================================
    @Test
    @DisplayName("16: Reject assigning complaint to user from another Panchayat")
    void crossPanchayatAssignee_Rejected() throws Exception {
        Complaint complaint = complaintRepository.save(new Complaint(
                "CMP-2026-001001", panchayat1.getId(), citizenP1.getId(),
                ComplaintCategory.WATER, "Leak", "Desc",
                ComplaintPriority.MEDIUM, null
        ));

        // Try assigning to secretaryP2 (from Panchayat 2)
        AssignComplaintRequest assignReq = new AssignComplaintRequest(secretaryP2.getId(), "Cross GP assign");

        mockMvc.perform(patch("/api/v1/complaints/" + complaint.getId() + "/assign")
                        .header("Authorization", "Bearer " + secretaryTokenP1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assignReq)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", containsString("Cannot assign complaint to a user from another Panchayat")));
    }

    // ==========================================
    // 17. Role Authorization
    // ==========================================
    @Test
    @DisplayName("17: Sarpanch can view complaints but cannot close or assign them")
    void roleAuthorization_SarpanchRestrictions() throws Exception {
        Complaint complaint = complaintRepository.save(new Complaint(
                "CMP-2026-001101", panchayat1.getId(), citizenP1.getId(),
                ComplaintCategory.ROAD, "Road issue", "Desc",
                ComplaintPriority.MEDIUM, null
        ));
        complaint.setStatus(ComplaintStatus.RESOLVED);
        complaint.setResolution("Work done");
        complaintRepository.save(complaint);

        // Sarpanch can view
        mockMvc.perform(get("/api/v1/complaints/" + complaint.getId())
                        .header("Authorization", "Bearer " + sarpanchTokenP1))
                .andExpect(status().isOk());

        // Sarpanch cannot close (requires SECRETARY or ADMIN)
        mockMvc.perform(patch("/api/v1/complaints/" + complaint.getId() + "/close")
                        .header("Authorization", "Bearer " + sarpanchTokenP1))
                .andExpect(status().isForbidden());

        // Sarpanch cannot assign
        mockMvc.perform(patch("/api/v1/complaints/" + complaint.getId() + "/assign")
                        .header("Authorization", "Bearer " + sarpanchTokenP1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AssignComplaintRequest(grsP1.getId(), null))))
                .andExpect(status().isForbidden());
    }

    // ==========================================
    // 18. Dashboard Summary
    // ==========================================
    @Test
    @DisplayName("18: Summary endpoint returns counts by status, category, and priority")
    void getSummary_Success() throws Exception {
        Complaint c1 = new Complaint("CMP-2026-001201", panchayat1.getId(), citizenP1.getId(),
                ComplaintCategory.WATER, "Water 1", "Desc", ComplaintPriority.HIGH, null);
        c1.setStatus(ComplaintStatus.OPEN);
        complaintRepository.save(c1);

        Complaint c2 = new Complaint("CMP-2026-001202", panchayat1.getId(), citizenP2.getId(),
                ComplaintCategory.WATER, "Water 2", "Desc", ComplaintPriority.MEDIUM, null);
        c2.setStatus(ComplaintStatus.RESOLVED);
        c2.setResolution("Fixed");
        complaintRepository.save(c2);

        Complaint c3 = new Complaint("CMP-2026-001203", panchayat1.getId(), citizenP1.getId(),
                ComplaintCategory.ROAD, "Road 1", "Desc", ComplaintPriority.LOW, null);
        c3.setStatus(ComplaintStatus.CLOSED);
        c3.setResolution("Repaved");
        complaintRepository.save(c3);

        mockMvc.perform(get("/api/v1/complaints/summary")
                        .header("Authorization", "Bearer " + secretaryTokenP1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(3))
                .andExpect(jsonPath("$.open").value(1))
                .andExpect(jsonPath("$.resolved").value(1))
                .andExpect(jsonPath("$.closed").value(1))
                .andExpect(jsonPath("$.byCategory.WATER").value(2))
                .andExpect(jsonPath("$.byCategory.ROAD").value(1))
                .andExpect(jsonPath("$.byPriority.HIGH").value(1));
    }

    // ==========================================
    // 19. Date Filtering
    // ==========================================
    @Test
    @DisplayName("19: Filter complaints by date range")
    void dateFiltering_Success() throws Exception {
        Complaint c = new Complaint("CMP-2026-001301", panchayat1.getId(), citizenP1.getId(),
                ComplaintCategory.WATER, "Water Issue", "Desc", ComplaintPriority.MEDIUM, null);
        complaintRepository.save(c);

        String today = LocalDate.now().toString();

        mockMvc.perform(get("/api/v1/complaints?fromDate=" + today + "&toDate=" + today)
                        .header("Authorization", "Bearer " + secretaryTokenP1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1));

        // Invalid date range (fromDate > toDate)
        mockMvc.perform(get("/api/v1/complaints?fromDate=2026-12-31&toDate=2026-01-01")
                        .header("Authorization", "Bearer " + secretaryTokenP1))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("fromDate cannot be after toDate")));
    }

    // ==========================================
    // 20. Complaint History & Activity Events
    // ==========================================
    @Test
    @DisplayName("20: Full complaint activity history is recorded and accessible")
    void complaintHistory_Success() throws Exception {
        // 1. Create complaint
        CreateComplaintRequest createReq = new CreateComplaintRequest(
                citizenP1.getId(), ComplaintCategory.WATER, "Leakage", "Pipeline burst",
                ComplaintPriority.HIGH, null, null
        );

        String createRes = mockMvc.perform(post("/api/v1/complaints")
                        .header("Authorization", "Bearer " + secretaryTokenP1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        ComplaintResponse created = objectMapper.readValue(createRes, ComplaintResponse.class);

        // 2. Assign
        mockMvc.perform(patch("/api/v1/complaints/" + created.id() + "/assign")
                        .header("Authorization", "Bearer " + secretaryTokenP1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AssignComplaintRequest(grsP1.getId(), "Urgent task"))))
                .andExpect(status().isOk());

        // 3. Status to IN_PROGRESS
        mockMvc.perform(patch("/api/v1/complaints/" + created.id() + "/status")
                        .header("Authorization", "Bearer " + grsTokenP1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateComplaintStatusRequest(ComplaintStatus.IN_PROGRESS, null, "Arrived at site"))))
                .andExpect(status().isOk());

        // 4. Resolve
        mockMvc.perform(patch("/api/v1/complaints/" + created.id() + "/resolve")
                        .header("Authorization", "Bearer " + grsTokenP1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ResolveComplaintRequest("Replaced burst pipe joint", null))))
                .andExpect(status().isOk());

        // 5. Check History
        mockMvc.perform(get("/api/v1/complaints/" + created.id() + "/history")
                        .header("Authorization", "Bearer " + secretaryTokenP1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(4)))
                .andExpect(jsonPath("$[0].action").value("CREATED"))
                .andExpect(jsonPath("$[1].action").value("ASSIGNED"))
                .andExpect(jsonPath("$[2].action").value("STATUS_CHANGED"))
                .andExpect(jsonPath("$[3].action").value("RESOLVED"));
    }
}
