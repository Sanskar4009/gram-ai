package com.gramai.complaint;

import com.gramai.auth.security.CustomUserPrincipal;
import com.gramai.citizen.Citizen;
import com.gramai.citizen.CitizenRepository;
import com.gramai.common.dto.PageResponse;
import com.gramai.common.exception.ForbiddenOperationException;
import com.gramai.common.exception.ResourceNotFoundException;
import com.gramai.complaint.dto.*;
import com.gramai.panchayat.Panchayat;
import com.gramai.panchayat.PanchayatRepository;
import com.gramai.user.Role;
import com.gramai.user.User;
import com.gramai.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ComplaintService {

    private static final Logger log = LoggerFactory.getLogger(ComplaintService.class);

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "id", "complaintNumber", "createdAt", "updatedAt", "priority", "status", "category"
    );

    private final ComplaintRepository complaintRepository;
    private final ComplaintHistoryRepository complaintHistoryRepository;
    private final PanchayatRepository panchayatRepository;
    private final CitizenRepository citizenRepository;
    private final UserRepository userRepository;

    public ComplaintService(
            ComplaintRepository complaintRepository,
            ComplaintHistoryRepository complaintHistoryRepository,
            PanchayatRepository panchayatRepository,
            CitizenRepository citizenRepository,
            UserRepository userRepository
    ) {
        this.complaintRepository = complaintRepository;
        this.complaintHistoryRepository = complaintHistoryRepository;
        this.panchayatRepository = panchayatRepository;
        this.citizenRepository = citizenRepository;
        this.userRepository = userRepository;
    }

    /**
     * Generates a unique, human-readable, non-predictable complaint number.
     * Format: CMP-YYYY-000001
     */
    public synchronized String generateComplaintNumber() {
        int currentYear = LocalDate.now().getYear();
        String prefix = "CMP-" + currentYear + "-";

        Optional<Complaint> latest = complaintRepository.findTopByComplaintNumberStartingWithOrderByComplaintNumberDesc(prefix);
        long nextSeq = 1;
        if (latest.isPresent()) {
            String lastNumber = latest.get().getComplaintNumber();
            if (lastNumber != null && lastNumber.length() > prefix.length()) {
                String seqStr = lastNumber.substring(prefix.length());
                try {
                    nextSeq = Long.parseLong(seqStr) + 1;
                } catch (NumberFormatException ignored) {
                    nextSeq = complaintRepository.count() + 1;
                }
            }
        }
        return String.format("%s%06d", prefix, nextSeq);
    }

    @Transactional
    public ComplaintResponse createComplaint(CreateComplaintRequest request, CustomUserPrincipal currentUser) {
        Role callerRole = currentUser.getRole();

        // RBAC: CITIZEN cannot manage complaints on behalf of others; ADMIN, SECRETARY, GRS can file complaints
        if (callerRole != Role.ADMIN && callerRole != Role.SECRETARY && callerRole != Role.GRS && callerRole != Role.CITIZEN) {
            throw new ForbiddenOperationException("Access denied: You do not have permission to register complaints.");
        }

        Long resolvedPanchayatId;
        if (callerRole == Role.ADMIN) {
            if (request.panchayatId() == null) {
                throw new IllegalArgumentException("Panchayat ID is required for complaint creation by Administrator.");
            }
            resolvedPanchayatId = request.panchayatId();
        } else {
            Long ownPanchayatId = currentUser.getPanchayatId();
            if (ownPanchayatId == null) {
                throw new ForbiddenOperationException("Access denied: Current user is not associated with any Panchayat.");
            }
            if (request.panchayatId() != null && !request.panchayatId().equals(ownPanchayatId)) {
                throw new ForbiddenOperationException("Access denied: You cannot register complaints for another Panchayat.");
            }
            resolvedPanchayatId = ownPanchayatId;
        }

        // Validate Panchayat existence
        Panchayat panchayat = panchayatRepository.findById(resolvedPanchayatId)
                .orElseThrow(() -> new ResourceNotFoundException("Panchayat not found with id: " + resolvedPanchayatId));

        // Validate Citizen existence and ensure same-Panchayat relationship (Prevent cross-Panchayat references)
        Citizen citizen = citizenRepository.findById(request.citizenId())
                .orElseThrow(() -> new ResourceNotFoundException("Citizen not found with id: " + request.citizenId()));

        if (!citizen.getPanchayatId().equals(resolvedPanchayatId)) {
            throw new ForbiddenOperationException("Access denied: Citizen does not belong to the complaint's Panchayat.");
        }

        // Validate assigned user if provided
        User assignedUser = null;
        if (request.assignedTo() != null) {
            assignedUser = userRepository.findById(request.assignedTo())
                    .orElseThrow(() -> new ResourceNotFoundException("Assigned user not found with id: " + request.assignedTo()));

            // User must belong to same Panchayat unless ADMIN
            if (assignedUser.getRole() != Role.ADMIN) {
                if (assignedUser.getPanchayatId() == null || !assignedUser.getPanchayatId().equals(resolvedPanchayatId)) {
                    throw new ForbiddenOperationException("Access denied: Cannot assign complaint to a user from another Panchayat.");
                }
            }
        }

        String complaintNumber = generateComplaintNumber();

        Complaint complaint = new Complaint(
                complaintNumber,
                resolvedPanchayatId,
                citizen.getId(),
                request.category(),
                request.title().trim(),
                request.description().trim(),
                request.resolvedPriority(),
                assignedUser != null ? assignedUser.getId() : null
        );

        Complaint saved = complaintRepository.save(complaint);

        // Record history event
        ComplaintHistory history = new ComplaintHistory(
                saved.getId(),
                "CREATED",
                null,
                ComplaintStatus.OPEN,
                currentUser.getId(),
                currentUser.getFullName(),
                currentUser.getRole().name(),
                "Complaint filed: " + saved.getTitle()
        );
        complaintHistoryRepository.save(history);

        log.info("Registered complaint {} in Panchayat ID {} for citizen ID {}",
                complaintNumber, resolvedPanchayatId, citizen.getId());

        return ComplaintResponse.from(saved, panchayat.getName(), citizen, assignedUser);
    }

    @Transactional(readOnly = true)
    public PageResponse<ComplaintResponse> getComplaints(
            Long filterPanchayatId,
            String search,
            ComplaintStatus status,
            ComplaintCategory category,
            ComplaintPriority priority,
            Long assignedTo,
            Long citizenId,
            Instant fromDate,
            Instant toDate,
            Pageable pageable,
            CustomUserPrincipal currentUser
    ) {
        Long effectivePanchayatId;

        if (currentUser.getRole() == Role.ADMIN) {
            effectivePanchayatId = filterPanchayatId;
        } else {
            Long ownPanchayatId = currentUser.getPanchayatId();
            if (ownPanchayatId == null) {
                Page<ComplaintResponse> emptyPage = new PageImpl<>(Collections.emptyList(), pageable, 0);
                return PageResponse.from(emptyPage);
            }

            // Cross-panchayat filter attempt by non-admin is strictly forbidden
            if (filterPanchayatId != null && !filterPanchayatId.equals(ownPanchayatId)) {
                throw new ForbiddenOperationException("Access denied: You cannot view complaints belonging to another Panchayat.");
            }

            effectivePanchayatId = ownPanchayatId;
        }

        // CITIZEN role restriction: if citizen calls, scope to their complaints
        Long effectiveCitizenId = citizenId;
        if (currentUser.getRole() == Role.CITIZEN) {
            // Find citizen by mobile / email
            Optional<Citizen> linkedCitizen = citizenRepository.findByPanchayatIdAndMobile(
                    currentUser.getPanchayatId(), currentUser.getUsername()
            ).stream().findFirst();

            if (linkedCitizen.isPresent()) {
                effectiveCitizenId = linkedCitizen.get().getId();
            } else {
                // If citizen user has no linked registry entry yet, return empty
                Page<ComplaintResponse> emptyPage = new PageImpl<>(Collections.emptyList(), pageable, 0);
                return PageResponse.from(emptyPage);
            }
        }

        String cleanSearch = search != null && !search.isBlank() ? search.trim() : null;

        Page<Complaint> page = complaintRepository.findWithFilters(
                effectivePanchayatId,
                status,
                category,
                priority,
                assignedTo,
                effectiveCitizenId,
                fromDate,
                toDate,
                cleanSearch,
                pageable
        );

        // Batch resolve associations
        Set<Long> panchayatIds = page.getContent().stream().map(Complaint::getPanchayatId).collect(Collectors.toSet());
        Set<Long> citizenIds = page.getContent().stream().map(Complaint::getCitizenId).collect(Collectors.toSet());
        Set<Long> assignedUserIds = page.getContent().stream()
                .map(Complaint::getAssignedTo)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<Long, String> panchayatMap = panchayatRepository.findAllById(panchayatIds).stream()
                .collect(Collectors.toMap(Panchayat::getId, Panchayat::getName));

        Map<Long, Citizen> citizenMap = citizenRepository.findAllById(citizenIds).stream()
                .collect(Collectors.toMap(Citizen::getId, c -> c));

        Map<Long, User> userMap = assignedUserIds.isEmpty() ? Collections.emptyMap() :
                userRepository.findAllById(assignedUserIds).stream()
                        .collect(Collectors.toMap(User::getId, u -> u));

        Page<ComplaintResponse> mapped = page.map(c -> ComplaintResponse.from(
                c,
                panchayatMap.get(c.getPanchayatId()),
                citizenMap.get(c.getCitizenId()),
                c.getAssignedTo() != null ? userMap.get(c.getAssignedTo()) : null
        ));

        return PageResponse.from(mapped);
    }

    @Transactional(readOnly = true)
    public ComplaintResponse getComplaintById(Long id, CustomUserPrincipal currentUser) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with id: " + id));

        // Enforce Panchayat isolation for non-ADMIN
        if (currentUser.getRole() != Role.ADMIN) {
            boolean isSamePanchayat = currentUser.getPanchayatId() != null
                    && currentUser.getPanchayatId().equals(complaint.getPanchayatId());
            if (!isSamePanchayat) {
                throw new ForbiddenOperationException("Access denied: You do not have permission to view complaints outside your Panchayat.");
            }

            // CITIZEN role restriction: can only view own complaints
            if (currentUser.getRole() == Role.CITIZEN) {
                Citizen citizen = citizenRepository.findById(complaint.getCitizenId()).orElse(null);
                boolean matchesCitizen = citizen != null && citizen.getMobile() != null
                        && citizen.getMobile().equals(currentUser.getUsername());
                if (!matchesCitizen) {
                    throw new ForbiddenOperationException("Access denied: You can only view your own registered complaints.");
                }
            }
        }

        String panchayatName = panchayatRepository.findById(complaint.getPanchayatId())
                .map(Panchayat::getName)
                .orElse(null);

        Citizen citizen = citizenRepository.findById(complaint.getCitizenId()).orElse(null);
        User assignedUser = complaint.getAssignedTo() != null
                ? userRepository.findById(complaint.getAssignedTo()).orElse(null)
                : null;

        return ComplaintResponse.from(complaint, panchayatName, citizen, assignedUser);
    }

    @Transactional(readOnly = true)
    public List<ComplaintHistoryResponse> getComplaintHistory(Long id, CustomUserPrincipal currentUser) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with id: " + id));

        // Enforce Panchayat isolation for non-ADMIN
        if (currentUser.getRole() != Role.ADMIN) {
            boolean isSamePanchayat = currentUser.getPanchayatId() != null
                    && currentUser.getPanchayatId().equals(complaint.getPanchayatId());
            if (!isSamePanchayat) {
                throw new ForbiddenOperationException("Access denied: You do not have permission to view complaint history outside your Panchayat.");
            }
        }

        List<ComplaintHistory> history = complaintHistoryRepository.findByComplaintIdOrderByCreatedAtAsc(id);
        return history.stream().map(ComplaintHistoryResponse::from).toList();
    }

    @Transactional
    public ComplaintResponse updateComplaint(Long id, UpdateComplaintRequest request, CustomUserPrincipal currentUser) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with id: " + id));

        Role callerRole = currentUser.getRole();
        if (callerRole != Role.ADMIN && callerRole != Role.SECRETARY && callerRole != Role.GRS) {
            throw new ForbiddenOperationException("Access denied: You do not have permission to edit complaints.");
        }

        // Panchayat isolation
        if (callerRole != Role.ADMIN) {
            boolean isSamePanchayat = currentUser.getPanchayatId() != null
                    && currentUser.getPanchayatId().equals(complaint.getPanchayatId());
            if (!isSamePanchayat) {
                throw new ForbiddenOperationException("Access denied: Cannot edit complaints outside your Panchayat.");
            }
        }

        // Validate citizen update if specified
        if (request.citizenId() != null && !request.citizenId().equals(complaint.getCitizenId())) {
            Citizen citizen = citizenRepository.findById(request.citizenId())
                    .orElseThrow(() -> new ResourceNotFoundException("Citizen not found with id: " + request.citizenId()));
            if (!citizen.getPanchayatId().equals(complaint.getPanchayatId())) {
                throw new ForbiddenOperationException("Access denied: Citizen does not belong to the complaint's Panchayat.");
            }
            complaint.setCitizenId(request.citizenId());
        }

        // Validate assigned user if specified
        if (request.assignedTo() != null && !request.assignedTo().equals(complaint.getAssignedTo())) {
            User assignedUser = userRepository.findById(request.assignedTo())
                    .orElseThrow(() -> new ResourceNotFoundException("Assigned user not found with id: " + request.assignedTo()));
            if (assignedUser.getRole() != Role.ADMIN) {
                if (assignedUser.getPanchayatId() == null || !assignedUser.getPanchayatId().equals(complaint.getPanchayatId())) {
                    throw new ForbiddenOperationException("Access denied: Cannot assign complaint to a user from another Panchayat.");
                }
            }
            complaint.setAssignedTo(request.assignedTo());
        }

        if (request.category() != null) {
            complaint.setCategory(request.category());
        }
        if (request.title() != null && !request.title().isBlank()) {
            complaint.setTitle(request.title().trim());
        }
        if (request.description() != null && !request.description().isBlank()) {
            complaint.setDescription(request.description().trim());
        }
        if (request.priority() != null) {
            complaint.setPriority(request.priority());
        }

        Complaint saved = complaintRepository.save(complaint);

        // Record history
        ComplaintHistory history = new ComplaintHistory(
                saved.getId(),
                "UPDATED",
                saved.getStatus(),
                saved.getStatus(),
                currentUser.getId(),
                currentUser.getFullName(),
                currentUser.getRole().name(),
                "Complaint details modified"
        );
        complaintHistoryRepository.save(history);

        String panchayatName = panchayatRepository.findById(saved.getPanchayatId()).map(Panchayat::getName).orElse(null);
        Citizen citizen = citizenRepository.findById(saved.getCitizenId()).orElse(null);
        User assignedUser = saved.getAssignedTo() != null ? userRepository.findById(saved.getAssignedTo()).orElse(null) : null;

        return ComplaintResponse.from(saved, panchayatName, citizen, assignedUser);
    }

    @Transactional
    public ComplaintResponse updateStatus(Long id, UpdateComplaintStatusRequest request, CustomUserPrincipal currentUser) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with id: " + id));

        Role callerRole = currentUser.getRole();
        if (callerRole != Role.ADMIN && callerRole != Role.SECRETARY && callerRole != Role.GRS) {
            throw new ForbiddenOperationException("Access denied: You do not have permission to change complaint status.");
        }

        // Panchayat isolation
        if (callerRole != Role.ADMIN) {
            boolean isSamePanchayat = currentUser.getPanchayatId() != null
                    && currentUser.getPanchayatId().equals(complaint.getPanchayatId());
            if (!isSamePanchayat) {
                throw new ForbiddenOperationException("Access denied: Cannot update complaint status outside your Panchayat.");
            }
        }

        ComplaintStatus targetStatus = request.status();
        ComplaintStatus currentStatus = complaint.getStatus();

        // Enforce state machine transitions
        if (!currentStatus.canTransitionTo(targetStatus)) {
            throw new IllegalArgumentException(
                    "Invalid status transition from " + currentStatus + " to " + targetStatus + "."
            );
        }

        // Enforce resolution note requirement when transitioning to RESOLVED
        if (targetStatus == ComplaintStatus.RESOLVED) {
            String resolutionNote = request.resolution() != null && !request.resolution().isBlank()
                    ? request.resolution().trim()
                    : (request.note() != null && !request.note().isBlank() ? request.note().trim() : null);

            if (resolutionNote == null) {
                throw new IllegalArgumentException("Resolution note is required before marking complaint as RESOLVED.");
            }
            complaint.setResolution(resolutionNote);
            complaint.setResolvedAt(Instant.now());
        }

        // Enforce resolution requirement when closing
        if (targetStatus == ComplaintStatus.CLOSED) {
            if (complaint.getResolution() == null || complaint.getResolution().isBlank()) {
                throw new IllegalArgumentException("A complaint cannot be CLOSED without resolution information.");
            }
        }

        // Reset resolvedAt if reopening from RESOLVED back to IN_PROGRESS
        if (currentStatus == ComplaintStatus.RESOLVED && targetStatus == ComplaintStatus.IN_PROGRESS) {
            complaint.setResolvedAt(null);
        }

        complaint.setStatus(targetStatus);
        Complaint saved = complaintRepository.save(complaint);

        // Record history event
        String noteText = request.note() != null && !request.note().isBlank()
                ? request.note().trim()
                : (request.resolution() != null ? request.resolution().trim() : "Status changed to " + targetStatus);

        ComplaintHistory history = new ComplaintHistory(
                saved.getId(),
                "STATUS_CHANGED",
                currentStatus,
                targetStatus,
                currentUser.getId(),
                currentUser.getFullName(),
                currentUser.getRole().name(),
                noteText
        );
        complaintHistoryRepository.save(history);

        String panchayatName = panchayatRepository.findById(saved.getPanchayatId()).map(Panchayat::getName).orElse(null);
        Citizen citizen = citizenRepository.findById(saved.getCitizenId()).orElse(null);
        User assignedUser = saved.getAssignedTo() != null ? userRepository.findById(saved.getAssignedTo()).orElse(null) : null;

        return ComplaintResponse.from(saved, panchayatName, citizen, assignedUser);
    }

    @Transactional
    public ComplaintResponse assignComplaint(Long id, AssignComplaintRequest request, CustomUserPrincipal currentUser) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with id: " + id));

        Role callerRole = currentUser.getRole();
        if (callerRole != Role.ADMIN && callerRole != Role.SECRETARY) {
            throw new ForbiddenOperationException("Access denied: Only Secretary and Administrator can assign complaints.");
        }

        // Panchayat isolation
        if (callerRole != Role.ADMIN) {
            boolean isSamePanchayat = currentUser.getPanchayatId() != null
                    && currentUser.getPanchayatId().equals(complaint.getPanchayatId());
            if (!isSamePanchayat) {
                throw new ForbiddenOperationException("Access denied: Cannot assign complaints outside your Panchayat.");
            }
        }

        User assignedUser = null;
        if (request.assignedTo() != null) {
            assignedUser = userRepository.findById(request.assignedTo())
                    .orElseThrow(() -> new ResourceNotFoundException("Assigned user not found with id: " + request.assignedTo()));

            // User must belong to same Panchayat unless ADMIN
            if (assignedUser.getRole() != Role.ADMIN) {
                if (assignedUser.getPanchayatId() == null || !assignedUser.getPanchayatId().equals(complaint.getPanchayatId())) {
                    throw new ForbiddenOperationException("Access denied: Cannot assign complaint to a user from another Panchayat.");
                }
            }
        }

        complaint.setAssignedTo(request.assignedTo());
        Complaint saved = complaintRepository.save(complaint);

        String historyNote = assignedUser != null
                ? "Assigned to " + assignedUser.getFullName() + " (" + assignedUser.getRole() + ")"
                : "Complaint unassigned";

        if (request.note() != null && !request.note().isBlank()) {
            historyNote += " — " + request.note().trim();
        }

        ComplaintHistory history = new ComplaintHistory(
                saved.getId(),
                "ASSIGNED",
                saved.getStatus(),
                saved.getStatus(),
                currentUser.getId(),
                currentUser.getFullName(),
                currentUser.getRole().name(),
                historyNote
        );
        complaintHistoryRepository.save(history);

        String panchayatName = panchayatRepository.findById(saved.getPanchayatId()).map(Panchayat::getName).orElse(null);
        Citizen citizen = citizenRepository.findById(saved.getCitizenId()).orElse(null);

        return ComplaintResponse.from(saved, panchayatName, citizen, assignedUser);
    }

    @Transactional
    public ComplaintResponse resolveComplaint(Long id, ResolveComplaintRequest request, CustomUserPrincipal currentUser) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with id: " + id));

        Role callerRole = currentUser.getRole();
        if (callerRole != Role.ADMIN && callerRole != Role.SECRETARY && callerRole != Role.GRS) {
            throw new ForbiddenOperationException("Access denied: You do not have permission to resolve complaints.");
        }

        // Panchayat isolation
        if (callerRole != Role.ADMIN) {
            boolean isSamePanchayat = currentUser.getPanchayatId() != null
                    && currentUser.getPanchayatId().equals(complaint.getPanchayatId());
            if (!isSamePanchayat) {
                throw new ForbiddenOperationException("Access denied: Cannot resolve complaints outside your Panchayat.");
            }
        }

        if (complaint.getStatus() != ComplaintStatus.IN_PROGRESS && complaint.getStatus() != ComplaintStatus.WAITING) {
            throw new IllegalArgumentException(
                    "Complaint can only be marked as RESOLVED from IN_PROGRESS or WAITING status (current: " + complaint.getStatus() + ")."
            );
        }

        if (request.resolution() == null || request.resolution().isBlank()) {
            throw new IllegalArgumentException("Resolution note is required to resolve a complaint.");
        }

        ComplaintStatus oldStatus = complaint.getStatus();
        complaint.setStatus(ComplaintStatus.RESOLVED);
        complaint.setResolution(request.resolution().trim());
        complaint.setResolvedAt(Instant.now());

        Complaint saved = complaintRepository.save(complaint);

        String historyDetails = "Resolution: " + request.resolution().trim();
        if (request.additionalNotes() != null && !request.additionalNotes().isBlank()) {
            historyDetails += " | Notes: " + request.additionalNotes().trim();
        }

        ComplaintHistory history = new ComplaintHistory(
                saved.getId(),
                "RESOLVED",
                oldStatus,
                ComplaintStatus.RESOLVED,
                currentUser.getId(),
                currentUser.getFullName(),
                currentUser.getRole().name(),
                historyDetails
        );
        complaintHistoryRepository.save(history);

        String panchayatName = panchayatRepository.findById(saved.getPanchayatId()).map(Panchayat::getName).orElse(null);
        Citizen citizen = citizenRepository.findById(saved.getCitizenId()).orElse(null);
        User assignedUser = saved.getAssignedTo() != null ? userRepository.findById(saved.getAssignedTo()).orElse(null) : null;

        return ComplaintResponse.from(saved, panchayatName, citizen, assignedUser);
    }

    @Transactional
    public ComplaintResponse closeComplaint(Long id, CloseComplaintRequest request, CustomUserPrincipal currentUser) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with id: " + id));

        Role callerRole = currentUser.getRole();
        if (callerRole != Role.ADMIN && callerRole != Role.SECRETARY) {
            throw new ForbiddenOperationException("Access denied: Only Secretary and Administrator can close complaints.");
        }

        // Panchayat isolation
        if (callerRole != Role.ADMIN) {
            boolean isSamePanchayat = currentUser.getPanchayatId() != null
                    && currentUser.getPanchayatId().equals(complaint.getPanchayatId());
            if (!isSamePanchayat) {
                throw new ForbiddenOperationException("Access denied: Cannot close complaints outside your Panchayat.");
            }
        }

        if (complaint.getStatus() != ComplaintStatus.RESOLVED) {
            throw new IllegalArgumentException(
                    "Cannot close complaint. Complaint must be in RESOLVED status before it can be closed (current: " + complaint.getStatus() + ")."
            );
        }

        if (complaint.getResolution() == null || complaint.getResolution().isBlank()) {
            throw new IllegalArgumentException("Cannot close complaint without recorded resolution information.");
        }

        complaint.setStatus(ComplaintStatus.CLOSED);
        Complaint saved = complaintRepository.save(complaint);

        String historyDetails = "Complaint verified and closed";
        if (request != null && request.closingRemarks() != null && !request.closingRemarks().isBlank()) {
            historyDetails += " — " + request.closingRemarks().trim();
        }

        ComplaintHistory history = new ComplaintHistory(
                saved.getId(),
                "CLOSED",
                ComplaintStatus.RESOLVED,
                ComplaintStatus.CLOSED,
                currentUser.getId(),
                currentUser.getFullName(),
                currentUser.getRole().name(),
                historyDetails
        );
        complaintHistoryRepository.save(history);

        String panchayatName = panchayatRepository.findById(saved.getPanchayatId()).map(Panchayat::getName).orElse(null);
        Citizen citizen = citizenRepository.findById(saved.getCitizenId()).orElse(null);
        User assignedUser = saved.getAssignedTo() != null ? userRepository.findById(saved.getAssignedTo()).orElse(null) : null;

        return ComplaintResponse.from(saved, panchayatName, citizen, assignedUser);
    }

    @Transactional(readOnly = true)
    public ComplaintSummaryResponse getSummary(Long filterPanchayatId, CustomUserPrincipal currentUser) {
        Long effectivePanchayatId;

        if (currentUser.getRole() == Role.ADMIN) {
            effectivePanchayatId = filterPanchayatId;
        } else {
            Long ownPanchayatId = currentUser.getPanchayatId();
            if (ownPanchayatId == null) {
                return new ComplaintSummaryResponse(0, 0, 0, 0, 0, 0, 0, Collections.emptyMap(), Collections.emptyMap());
            }

            if (filterPanchayatId != null && !filterPanchayatId.equals(ownPanchayatId)) {
                throw new ForbiddenOperationException("Access denied: You cannot view complaint summary for another Panchayat.");
            }
            effectivePanchayatId = ownPanchayatId;
        }

        long total;
        long open;
        long inProgress;
        long waiting;
        long resolved;
        long closed;
        long rejected;
        Map<String, Long> byCategory = new LinkedHashMap<>();
        Map<String, Long> byPriority = new LinkedHashMap<>();

        if (effectivePanchayatId != null) {
            total = complaintRepository.countByPanchayatId(effectivePanchayatId);
            open = complaintRepository.countByPanchayatIdAndStatus(effectivePanchayatId, ComplaintStatus.OPEN);
            inProgress = complaintRepository.countByPanchayatIdAndStatus(effectivePanchayatId, ComplaintStatus.IN_PROGRESS);
            waiting = complaintRepository.countByPanchayatIdAndStatus(effectivePanchayatId, ComplaintStatus.WAITING);
            resolved = complaintRepository.countByPanchayatIdAndStatus(effectivePanchayatId, ComplaintStatus.RESOLVED);
            closed = complaintRepository.countByPanchayatIdAndStatus(effectivePanchayatId, ComplaintStatus.CLOSED);
            rejected = complaintRepository.countByPanchayatIdAndStatus(effectivePanchayatId, ComplaintStatus.REJECTED);

            for (Object[] row : complaintRepository.countGroupedByCategory(effectivePanchayatId)) {
                ComplaintCategory cat = (ComplaintCategory) row[0];
                Long count = (Long) row[1];
                byCategory.put(cat.name(), count);
            }

            for (Object[] row : complaintRepository.countGroupedByPriority(effectivePanchayatId)) {
                ComplaintPriority prio = (ComplaintPriority) row[0];
                Long count = (Long) row[1];
                byPriority.put(prio.name(), count);
            }
        } else {
            total = complaintRepository.count();
            open = complaintRepository.findAll().stream().filter(c -> c.getStatus() == ComplaintStatus.OPEN).count();
            inProgress = complaintRepository.findAll().stream().filter(c -> c.getStatus() == ComplaintStatus.IN_PROGRESS).count();
            waiting = complaintRepository.findAll().stream().filter(c -> c.getStatus() == ComplaintStatus.WAITING).count();
            resolved = complaintRepository.findAll().stream().filter(c -> c.getStatus() == ComplaintStatus.RESOLVED).count();
            closed = complaintRepository.findAll().stream().filter(c -> c.getStatus() == ComplaintStatus.CLOSED).count();
            rejected = complaintRepository.findAll().stream().filter(c -> c.getStatus() == ComplaintStatus.REJECTED).count();

            for (ComplaintCategory cat : ComplaintCategory.values()) {
                long cCount = complaintRepository.findAll().stream().filter(c -> c.getCategory() == cat).count();
                if (cCount > 0) byCategory.put(cat.name(), cCount);
            }
            for (ComplaintPriority prio : ComplaintPriority.values()) {
                long pCount = complaintRepository.findAll().stream().filter(c -> c.getPriority() == prio).count();
                if (pCount > 0) byPriority.put(prio.name(), pCount);
            }
        }

        return new ComplaintSummaryResponse(
                total,
                open,
                inProgress,
                waiting,
                resolved,
                closed,
                rejected,
                byCategory,
                byPriority
        );
    }

    /**
     * Sanitizes sort parameters to prevent arbitrary SQL/column injection.
     */
    public Sort sanitizeSort(String sortParam) {
        if (sortParam == null || sortParam.isBlank()) {
            return Sort.by("createdAt").descending();
        }

        String[] parts = sortParam.split(",");
        String property = parts[0].trim();
        Sort.Direction direction = Sort.Direction.ASC;

        if (parts.length > 1 && "desc".equalsIgnoreCase(parts[1].trim())) {
            direction = Sort.Direction.DESC;
        }

        if (!ALLOWED_SORT_FIELDS.contains(property)) {
            return Sort.by("createdAt").descending();
        }

        return Sort.by(direction, property);
    }
}
