package com.gramai.config;

import com.gramai.citizen.CitizenRepository;
import com.gramai.panchayat.Panchayat;
import com.gramai.panchayat.PanchayatRepository;
import com.gramai.user.Role;
import com.gramai.user.User;
import com.gramai.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true", matchIfMissing = true)
public class DevDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DevDataSeeder.class);

    private final UserRepository userRepository;
    private final PanchayatRepository panchayatRepository;
    private final CitizenRepository citizenRepository;
    private final com.gramai.complaint.ComplaintRepository complaintRepository;
    private final com.gramai.complaint.ComplaintHistoryRepository complaintHistoryRepository;
    private final PasswordEncoder passwordEncoder;

    public DevDataSeeder(
            UserRepository userRepository,
            PanchayatRepository panchayatRepository,
            CitizenRepository citizenRepository,
            com.gramai.complaint.ComplaintRepository complaintRepository,
            com.gramai.complaint.ComplaintHistoryRepository complaintHistoryRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.panchayatRepository = panchayatRepository;
        this.citizenRepository = citizenRepository;
        this.complaintRepository = complaintRepository;
        this.complaintHistoryRepository = complaintHistoryRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Checking development data seeding...");

        Panchayat panchayat = panchayatRepository.findByCode("RAMPUR01").orElseGet(() -> {
            log.info("Seeding default demo Panchayat: Rampur Gram Panchayat (RAMPUR01)");
            return panchayatRepository.save(new Panchayat(
                    "Rampur Gram Panchayat",
                    "RAMPUR01",
                    "Sehore",
                    "Ichhawar",
                    "Madhya Pradesh"
            ));
        });

        seedUserIfNotExists("System Administrator", "admin@gramai.in", "9876543210", "Admin@123", Role.ADMIN, null, true);
        seedUserIfNotExists("Rameshwar Sharma (Sachiv)", "secretary@gramai.in", "9876543211", "Secretary@123", Role.SECRETARY, panchayat.getId(), true);
        seedUserIfNotExists("Kamla Bai (Sarpanch)", "sarpanch@gramai.in", "9876543212", "Sarpanch@123", Role.SARPANCH, panchayat.getId(), true);
        seedUserIfNotExists("Sunil Verma (GRS)", "grs@gramai.in", "9876543213", "Grs@12345", Role.GRS, panchayat.getId(), true);
        seedUserIfNotExists("Mohan Lal (Ward Panch)", "panch@gramai.in", "9876543214", "Panch@123", Role.PANCH, panchayat.getId(), true);
        seedUserIfNotExists("Ramcharan Yadav (Citizen)", "citizen@gramai.in", "9876543215", "Citizen@123", Role.CITIZEN, panchayat.getId(), true);
        seedUserIfNotExists("Suspended Staff Member", "inactive@gramai.in", "9876543216", "Inactive@123", Role.SECRETARY, panchayat.getId(), false);

        seedDemoCitizens(panchayat.getId());
        seedDemoComplaints(panchayat.getId());

        log.info("Development data seeding completed.");
    }

    private void seedDemoCitizens(Long panchayatId) {
        if (citizenRepository.countByPanchayatId(panchayatId) == 0) {
            log.info("Seeding demo citizen records for Panchayat ID: {}", panchayatId);
            citizenRepository.save(new com.gramai.citizen.Citizen(
                    panchayatId, "Rameshwar Dayal", "9876500001", "Rampur", 1, "Near Old Well, Main Basti", com.gramai.citizen.CitizenStatus.ACTIVE
            ));
            citizenRepository.save(new com.gramai.citizen.Citizen(
                    panchayatId, "Sita Devi", "9876500002", "Rampur", 1, "House #12, Ward 1", com.gramai.citizen.CitizenStatus.ACTIVE
            ));
            citizenRepository.save(new com.gramai.citizen.Citizen(
                    panchayatId, "Rajesh Kumar Patel", "9876500003", "Harrabhat", 2, "Near Primary School, Harrabhat", com.gramai.citizen.CitizenStatus.ACTIVE
            ));
            citizenRepository.save(new com.gramai.citizen.Citizen(
                    panchayatId, "Sunita Bai", "9876500004", "Harrabhat", 2, "Patel Mohalla, Harrabhat", com.gramai.citizen.CitizenStatus.ACTIVE
            ));
            citizenRepository.save(new com.gramai.citizen.Citizen(
                    panchayatId, "Vikram Singh", "9876500005", "Rampur", 3, "Station Road, Rampur", com.gramai.citizen.CitizenStatus.ACTIVE
            ));
            citizenRepository.save(new com.gramai.citizen.Citizen(
                    panchayatId, "Geeta Bai", "9876500006", "Pipaliya", 4, "River Bank, Pipaliya", com.gramai.citizen.CitizenStatus.INACTIVE
            ));
            citizenRepository.save(new com.gramai.citizen.Citizen(
                    panchayatId, "Kailash Chandra", "9876500007", "Pipaliya", 4, "Temple Street, Pipaliya", com.gramai.citizen.CitizenStatus.ACTIVE
            ));
            log.info("Seeded 7 demo citizens.");
        }
    }

    private void seedDemoComplaints(Long panchayatId) {
        if (complaintRepository.countByPanchayatId(panchayatId) == 0) {
            log.info("Seeding demo complaints for Panchayat ID: {}", panchayatId);

            var citizens = citizenRepository.findByPanchayatId(panchayatId, org.springframework.data.domain.PageRequest.of(0, 10)).getContent();
            if (citizens.isEmpty()) {
                return;
            }

            var grsUser = userRepository.findByEmail("grs@gramai.in").orElse(null);
            var secUser = userRepository.findByEmail("secretary@gramai.in").orElse(null);

            // 1. In Progress Water Complaint
            var c1 = new com.gramai.complaint.Complaint(
                    "CMP-2026-000001",
                    panchayatId,
                    citizens.get(0).getId(),
                    com.gramai.complaint.ComplaintCategory.WATER,
                    "पेयजल पाइपलाइन में रिसाव (Water Pipeline Leakage)",
                    "पुराने कुएं के पास मुख्य जलापूर्ति पाइपलाइन में रिसाव के कारण पानी की बर्बादी हो रही है एवं दबाव कम है।",
                    com.gramai.complaint.ComplaintPriority.HIGH,
                    grsUser != null ? grsUser.getId() : null
            );
            c1.setStatus(com.gramai.complaint.ComplaintStatus.IN_PROGRESS);
            var saved1 = complaintRepository.save(c1);
            complaintHistoryRepository.save(new com.gramai.complaint.ComplaintHistory(
                    saved1.getId(), "CREATED", null, com.gramai.complaint.ComplaintStatus.OPEN,
                    secUser != null ? secUser.getId() : null, "Rameshwar Sharma (Sachiv)", "SECRETARY", "Complaint logged"
            ));
            complaintHistoryRepository.save(new com.gramai.complaint.ComplaintHistory(
                    saved1.getId(), "ASSIGNED", com.gramai.complaint.ComplaintStatus.OPEN, com.gramai.complaint.ComplaintStatus.IN_PROGRESS,
                    secUser != null ? secUser.getId() : null, "Rameshwar Sharma (Sachiv)", "SECRETARY", "Assigned to Sunil Verma (GRS)"
            ));

            // 2. Open Streetlight Complaint
            if (citizens.size() > 3) {
                var c2 = new com.gramai.complaint.Complaint(
                        "CMP-2026-000002",
                        panchayatId,
                        citizens.get(3).getId(),
                        com.gramai.complaint.ComplaintCategory.STREET_LIGHT,
                        "पटेल मोहल्ला स्ट्रीट लाइट खराब (Streetlight Not Working)",
                        "वार्ड 2 पटेल मोहल्ले में 3 खंभों की स्ट्रीट लाइट पिछले 1 सप्ताह से बंद है, रात में अंधेरा रहता है।",
                        com.gramai.complaint.ComplaintPriority.MEDIUM,
                        null
                );
                var saved2 = complaintRepository.save(c2);
                complaintHistoryRepository.save(new com.gramai.complaint.ComplaintHistory(
                        saved2.getId(), "CREATED", null, com.gramai.complaint.ComplaintStatus.OPEN,
                        secUser != null ? secUser.getId() : null, "Rameshwar Sharma (Sachiv)", "SECRETARY", "Complaint registered"
                ));
            }

            // 3. Resolved Handpump Complaint
            if (citizens.size() > 2) {
                var c3 = new com.gramai.complaint.Complaint(
                        "CMP-2026-000003",
                        panchayatId,
                        citizens.get(2).getId(),
                        com.gramai.complaint.ComplaintCategory.WATER,
                        "प्राथमिक शाला हैंडपंप मरम्मत (Handpump Repair at School)",
                        "शाला परिसर के हैंडपंप का हैंडल टूटा हुआ है एवं वॉशर खराब होने से पानी नहीं निकल रहा है।",
                        com.gramai.complaint.ComplaintPriority.URGENT,
                        grsUser != null ? grsUser.getId() : null
                );
                c3.setStatus(com.gramai.complaint.ComplaintStatus.RESOLVED);
                c3.setResolution("हैंडपंप का वॉशर एवं नई चेन डालकर मरम्मत पूर्ण कर दी गई है। पानी सुचारू रूप से चालू है।");
                c3.setResolvedAt(java.time.Instant.now().minus(java.time.Duration.ofDays(1)));
                var saved3 = complaintRepository.save(c3);
                complaintHistoryRepository.save(new com.gramai.complaint.ComplaintHistory(
                        saved3.getId(), "RESOLVED", com.gramai.complaint.ComplaintStatus.IN_PROGRESS, com.gramai.complaint.ComplaintStatus.RESOLVED,
                        grsUser != null ? grsUser.getId() : null, "Sunil Verma (GRS)", "GRS", "Repairs completed successfully"
                ));
            }

            // 4. Closed Road Complaint
            if (citizens.size() > 4) {
                var c4 = new com.gramai.complaint.Complaint(
                        "CMP-2026-000004",
                        panchayatId,
                        citizens.get(4).getId(),
                        com.gramai.complaint.ComplaintCategory.ROAD,
                        "स्टेशन रोड गड्ढे भराव (Station Road Pothole Filling)",
                        "स्टेशन रोड पर भारी वाहनों से बड़े गड्ढे हो गए हैं, दोपहिया वाहनों का गिरना आम हो गया है।",
                        com.gramai.complaint.ComplaintPriority.LOW,
                        secUser != null ? secUser.getId() : null
                );
                c4.setStatus(com.gramai.complaint.ComplaintStatus.CLOSED);
                c4.setResolution("ग्राम निधि से मुरम एवं गिट्टी डालकर गड्ढों का समतलीकरण करवा दिया गया है।");
                c4.setResolvedAt(java.time.Instant.now().minus(java.time.Duration.ofDays(3)));
                var saved4 = complaintRepository.save(c4);
                complaintHistoryRepository.save(new com.gramai.complaint.ComplaintHistory(
                        saved4.getId(), "CLOSED", com.gramai.complaint.ComplaintStatus.RESOLVED, com.gramai.complaint.ComplaintStatus.CLOSED,
                        secUser != null ? secUser.getId() : null, "Rameshwar Sharma (Sachiv)", "SECRETARY", "Work inspected and closed"
                ));
            }

            // 5. Waiting Sanitation Complaint
            if (citizens.size() > 1) {
                var c5 = new com.gramai.complaint.Complaint(
                        "CMP-2026-000005",
                        panchayatId,
                        citizens.get(1).getId(),
                        com.gramai.complaint.ComplaintCategory.SANITATION,
                        "नाली चोक एवं जलभराव (Drainage Clog & Waterlogging)",
                        "वार्ड 1 मुख्य मार्ग किनारे पक्की नाली में मलबा जमा होने से गंदा पानी सड़क पर बह रहा है।",
                        com.gramai.complaint.ComplaintPriority.HIGH,
                        grsUser != null ? grsUser.getId() : null
                );
                c5.setStatus(com.gramai.complaint.ComplaintStatus.WAITING);
                var saved5 = complaintRepository.save(c5);
                complaintHistoryRepository.save(new com.gramai.complaint.ComplaintHistory(
                        saved5.getId(), "STATUS_CHANGED", com.gramai.complaint.ComplaintStatus.IN_PROGRESS, com.gramai.complaint.ComplaintStatus.WAITING,
                        grsUser != null ? grsUser.getId() : null, "Sunil Verma (GRS)", "GRS", "Waiting for sanitation tractor equipment from Janpad"
                ));
            }

            log.info("Seeded 5 demo complaints with activity histories.");
        }
    }

    private void seedUserIfNotExists(String fullName, String email, String mobile, String rawPassword, Role role, Long panchayatId, boolean active) {
        if (!userRepository.existsByEmail(email)) {
            User user = new User(fullName, email, mobile, passwordEncoder.encode(rawPassword), role, panchayatId);
            user.setActive(active);
            userRepository.save(user);
            log.info("Seeded user: {} [{}] (Active: {})", email, role, active);
        }
    }
}
