package com.gramai.citizen;

import com.gramai.auth.security.CustomUserPrincipal;
import com.gramai.common.dto.PageResponse;
import com.gramai.common.exception.ForbiddenOperationException;
import com.gramai.common.exception.ResourceNotFoundException;
import com.gramai.panchayat.Panchayat;
import com.gramai.panchayat.PanchayatRepository;
import com.gramai.citizen.dto.CreateCitizenRequest;
import com.gramai.citizen.dto.UpdateCitizenRequest;
import com.gramai.citizen.dto.CitizenResponse;
import com.gramai.user.Role;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class CitizenService {

    private static final Logger log = LoggerFactory.getLogger(CitizenService.class);

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "id", "fullName", "village", "wardNumber", "status", "createdAt", "updatedAt"
    );

    private final CitizenRepository citizenRepository;
    private final PanchayatRepository panchayatRepository;

    public CitizenService(CitizenRepository citizenRepository, PanchayatRepository panchayatRepository) {
        this.citizenRepository = citizenRepository;
        this.panchayatRepository = panchayatRepository;
    }

    @Transactional
    public CitizenResponse createCitizen(CreateCitizenRequest request, CustomUserPrincipal currentUser) {
        Role callerRole = currentUser.getRole();

        // Enforce RBAC: Only ADMIN and SECRETARY can create citizens
        if (callerRole != Role.ADMIN && callerRole != Role.SECRETARY) {
            throw new ForbiddenOperationException("Access denied: You do not have permission to create citizen records.");
        }

        Long resolvedPanchayatId;

        if (callerRole == Role.SECRETARY) {
            Long ownPanchayatId = currentUser.getPanchayatId();
            if (ownPanchayatId == null) {
                throw new ForbiddenOperationException("Access denied: Current user is not associated with any Panchayat.");
            }

            // Secretary cannot create citizens for another Panchayat
            if (request.panchayatId() != null && !request.panchayatId().equals(ownPanchayatId)) {
                throw new ForbiddenOperationException("Access denied: You cannot create citizens for another Panchayat.");
            }

            resolvedPanchayatId = ownPanchayatId;
        } else {
            // ADMIN role must provide a valid panchayatId
            if (request.panchayatId() == null) {
                throw new IllegalArgumentException("Panchayat ID is required for citizen creation by Administrator.");
            }
            resolvedPanchayatId = request.panchayatId();
        }

        // Validate Panchayat existence
        Panchayat panchayat = panchayatRepository.findById(resolvedPanchayatId)
                .orElseThrow(() -> new ResourceNotFoundException("Panchayat not found with id: " + resolvedPanchayatId));

        // Sensible duplicate detection / warning (log warning, do not block family members sharing mobile or names)
        String trimmedMobile = request.mobile() != null && !request.mobile().isBlank() ? request.mobile().trim() : null;
        if (trimmedMobile != null) {
            List<Citizen> mobileDuplicates = citizenRepository.findByPanchayatIdAndMobile(resolvedPanchayatId, trimmedMobile);
            if (!mobileDuplicates.isEmpty()) {
                log.info("Duplicate mobile notice: Citizen '{}' shares mobile '{}' with {} existing citizen(s) in Panchayat {}",
                        request.fullName().trim(), trimmedMobile, mobileDuplicates.size(), resolvedPanchayatId);
            }
        }

        Citizen citizen = new Citizen(
                resolvedPanchayatId,
                request.fullName().trim(),
                trimmedMobile,
                request.village().trim(),
                request.wardNumber(),
                request.address() != null && !request.address().isBlank() ? request.address().trim() : null
        );

        Citizen saved = citizenRepository.save(citizen);
        return CitizenResponse.from(saved, panchayat.getName());
    }

    @Transactional(readOnly = true)
    public CitizenResponse getCitizenById(Long id, CustomUserPrincipal currentUser) {
        Citizen citizen = citizenRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Citizen not found with id: " + id));

        // CITIZEN role is not permitted to inspect citizen registry
        if (currentUser.getRole() == Role.CITIZEN) {
            throw new ForbiddenOperationException("Access denied: Citizens do not have permission to access the Panchayat citizen registry.");
        }

        // Enforce multi-tenant Panchayat isolation for non-ADMIN
        if (currentUser.getRole() != Role.ADMIN) {
            boolean isSamePanchayat = currentUser.getPanchayatId() != null
                    && currentUser.getPanchayatId().equals(citizen.getPanchayatId());
            if (!isSamePanchayat) {
                throw new ForbiddenOperationException("Access denied: You do not have permission to view citizens outside your Panchayat.");
            }
        }

        String panchayatName = panchayatRepository.findById(citizen.getPanchayatId())
                .map(Panchayat::getName)
                .orElse(null);

        return CitizenResponse.from(citizen, panchayatName);
    }

    @Transactional(readOnly = true)
    public PageResponse<CitizenResponse> getCitizens(
            Long filterPanchayatId,
            String search,
            String village,
            Integer wardNumber,
            CitizenStatus status,
            Pageable pageable,
            CustomUserPrincipal currentUser
    ) {
        // CITIZEN role is strictly forbidden from querying the Panchayat citizen registry
        if (currentUser.getRole() == Role.CITIZEN) {
            throw new ForbiddenOperationException("Access denied: Citizens do not have permission to view the Panchayat citizen registry.");
        }

        Long effectivePanchayatId;

        if (currentUser.getRole() == Role.ADMIN) {
            effectivePanchayatId = filterPanchayatId;
        } else {
            Long ownPanchayatId = currentUser.getPanchayatId();
            if (ownPanchayatId == null) {
                Page<CitizenResponse> emptyPage = new PageImpl<>(Collections.emptyList(), pageable, 0);
                return PageResponse.from(emptyPage);
            }

            // Cross-panchayat filter attempt by non-admin is strictly forbidden
            if (filterPanchayatId != null && !filterPanchayatId.equals(ownPanchayatId)) {
                throw new ForbiddenOperationException("Access denied: You cannot view citizens belonging to another Panchayat.");
            }

            effectivePanchayatId = ownPanchayatId;
        }

        String cleanSearch = search != null && !search.isBlank() ? search.trim() : null;
        String cleanVillage = village != null && !village.isBlank() ? village.trim() : null;

        Page<Citizen> page = citizenRepository.findWithFilters(
                effectivePanchayatId,
                status,
                cleanVillage,
                wardNumber,
                cleanSearch,
                pageable
        );

        // Resolve Panchayat names in batch
        Set<Long> panchayatIds = page.getContent().stream()
                .map(Citizen::getPanchayatId)
                .collect(Collectors.toSet());

        Map<Long, String> panchayatNameMap = panchayatRepository.findAllById(panchayatIds).stream()
                .collect(Collectors.toMap(Panchayat::getId, Panchayat::getName));

        Page<CitizenResponse> mapped = page.map(c ->
                CitizenResponse.from(c, panchayatNameMap.get(c.getPanchayatId()))
        );

        return PageResponse.from(mapped);
    }

    @Transactional
    public CitizenResponse updateCitizen(Long id, UpdateCitizenRequest request, CustomUserPrincipal currentUser) {
        Citizen citizen = citizenRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Citizen not found with id: " + id));

        Role callerRole = currentUser.getRole();

        // RBAC: Only ADMIN and SECRETARY can update citizen records
        if (callerRole != Role.ADMIN && callerRole != Role.SECRETARY) {
            throw new ForbiddenOperationException("Access denied: You do not have permission to edit citizen records.");
        }

        // Enforce Panchayat isolation for non-ADMIN
        if (callerRole != Role.ADMIN) {
            boolean isSamePanchayat = currentUser.getPanchayatId() != null
                    && currentUser.getPanchayatId().equals(citizen.getPanchayatId());
            if (!isSamePanchayat) {
                throw new ForbiddenOperationException("Access denied: Cannot edit citizens outside your Panchayat.");
            }

            // Non-ADMIN cannot reassign a citizen to a different Panchayat
            if (request.panchayatId() != null && !request.panchayatId().equals(citizen.getPanchayatId())) {
                throw new ForbiddenOperationException("Access denied: You cannot change a citizen's Panchayat.");
            }
        } else {
            // ADMIN reassigning Panchayat must specify an existing Panchayat
            if (request.panchayatId() != null && !request.panchayatId().equals(citizen.getPanchayatId())) {
                if (!panchayatRepository.existsById(request.panchayatId())) {
                    throw new ResourceNotFoundException("Panchayat not found with id: " + request.panchayatId());
                }
                citizen.setPanchayatId(request.panchayatId());
            }
        }

        String trimmedMobile = request.mobile() != null && !request.mobile().isBlank() ? request.mobile().trim() : null;

        citizen.setFullName(request.fullName().trim());
        citizen.setMobile(trimmedMobile);
        citizen.setVillage(request.village().trim());
        citizen.setWardNumber(request.wardNumber());
        citizen.setAddress(request.address() != null && !request.address().isBlank() ? request.address().trim() : null);

        Citizen updated = citizenRepository.save(citizen);

        String panchayatName = panchayatRepository.findById(updated.getPanchayatId())
                .map(Panchayat::getName)
                .orElse(null);

        return CitizenResponse.from(updated, panchayatName);
    }

    @Transactional
    public CitizenResponse updateCitizenStatus(Long id, CitizenStatus newStatus, CustomUserPrincipal currentUser) {
        Citizen citizen = citizenRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Citizen not found with id: " + id));

        Role callerRole = currentUser.getRole();

        // RBAC: Only ADMIN and SECRETARY can deactivate/activate citizens
        if (callerRole != Role.ADMIN && callerRole != Role.SECRETARY) {
            throw new ForbiddenOperationException("Access denied: You do not have permission to modify citizen status.");
        }

        // Multi-tenant isolation
        if (callerRole != Role.ADMIN) {
            boolean isSamePanchayat = currentUser.getPanchayatId() != null
                    && currentUser.getPanchayatId().equals(citizen.getPanchayatId());
            if (!isSamePanchayat) {
                throw new ForbiddenOperationException("Access denied: Cannot modify citizen status outside your Panchayat.");
            }
        }

        citizen.setStatus(newStatus);
        Citizen saved = citizenRepository.save(citizen);

        String panchayatName = panchayatRepository.findById(saved.getPanchayatId())
                .map(Panchayat::getName)
                .orElse(null);

        return CitizenResponse.from(saved, panchayatName);
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
