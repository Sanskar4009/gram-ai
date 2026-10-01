package com.gramai.panchayat;

import com.gramai.auth.security.CustomUserPrincipal;
import com.gramai.common.dto.PageResponse;
import com.gramai.common.exception.DuplicateResourceException;
import com.gramai.common.exception.ForbiddenOperationException;
import com.gramai.common.exception.ResourceNotFoundException;
import com.gramai.panchayat.dto.CreatePanchayatRequest;
import com.gramai.panchayat.dto.PanchayatResponse;
import com.gramai.panchayat.dto.UpdatePanchayatRequest;
import com.gramai.user.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
public class PanchayatService {

    private final PanchayatRepository panchayatRepository;

    public PanchayatService(PanchayatRepository panchayatRepository) {
        this.panchayatRepository = panchayatRepository;
    }

    @Transactional
    public PanchayatResponse createPanchayat(CreatePanchayatRequest request) {
        if (panchayatRepository.existsByCode(request.code())) {
            throw new DuplicateResourceException("Panchayat with code '" + request.code() + "' already exists");
        }

        Panchayat panchayat = new Panchayat(
                request.name().trim(),
                request.code().trim().toUpperCase(),
                request.district().trim(),
                request.block().trim(),
                request.state().trim()
        );

        Panchayat saved = panchayatRepository.save(panchayat);
        return PanchayatResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public PanchayatResponse getPanchayatById(Long id, CustomUserPrincipal currentUser) {
        Panchayat panchayat = panchayatRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Panchayat not found with id: " + id));

        // Enforce strict tenant isolation: non-ADMIN users can ONLY view their assigned Panchayat
        if (currentUser.getRole() != Role.ADMIN) {
            if (currentUser.getPanchayatId() == null || !currentUser.getPanchayatId().equals(id)) {
                throw new ForbiddenOperationException("Access denied: You do not have permission to access data from another Panchayat.");
            }
        }

        return PanchayatResponse.from(panchayat);
    }

    @Transactional(readOnly = true)
    public PageResponse<PanchayatResponse> getPanchayats(String search, Pageable pageable, CustomUserPrincipal currentUser) {
        if (currentUser.getRole() == Role.ADMIN) {
            Page<Panchayat> page;
            if (search != null && !search.isBlank()) {
                page = panchayatRepository.searchPanchayats(search.trim(), pageable);
            } else {
                page = panchayatRepository.findAll(pageable);
            }
            return PageResponse.from(page.map(PanchayatResponse::from));
        }

        // Non-ADMIN users: scoped strictly to their own Panchayat
        if (currentUser.getPanchayatId() == null) {
            Page<PanchayatResponse> emptyPage = new PageImpl<>(Collections.emptyList(), pageable, 0);
            return PageResponse.from(emptyPage);
        }

        Panchayat ownPanchayat = panchayatRepository.findById(currentUser.getPanchayatId()).orElse(null);
        if (ownPanchayat == null) {
            Page<PanchayatResponse> emptyPage = new PageImpl<>(Collections.emptyList(), pageable, 0);
            return PageResponse.from(emptyPage);
        }

        // If search term is present, verify own panchayat matches
        if (search != null && !search.isBlank()) {
            String s = search.trim().toLowerCase();
            boolean matches = ownPanchayat.getName().toLowerCase().contains(s)
                    || ownPanchayat.getCode().toLowerCase().contains(s)
                    || ownPanchayat.getDistrict().toLowerCase().contains(s)
                    || ownPanchayat.getBlock().toLowerCase().contains(s)
                    || ownPanchayat.getState().toLowerCase().contains(s);
            if (!matches) {
                Page<PanchayatResponse> emptyPage = new PageImpl<>(Collections.emptyList(), pageable, 0);
                return PageResponse.from(emptyPage);
            }
        }

        Page<PanchayatResponse> singlePage = new PageImpl<>(List.of(PanchayatResponse.from(ownPanchayat)), pageable, 1);
        return PageResponse.from(singlePage);
    }

    @Transactional
    public PanchayatResponse updatePanchayat(Long id, UpdatePanchayatRequest request, CustomUserPrincipal currentUser) {
        if (currentUser.getRole() != Role.ADMIN) {
            throw new ForbiddenOperationException("Access denied: Only system administrators can update Panchayats.");
        }

        Panchayat panchayat = panchayatRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Panchayat not found with id: " + id));

        if (panchayatRepository.existsByCodeAndIdNot(request.code(), id)) {
            throw new DuplicateResourceException("Panchayat with code '" + request.code() + "' already exists");
        }

        panchayat.setName(request.name().trim());
        panchayat.setCode(request.code().trim().toUpperCase());
        panchayat.setDistrict(request.district().trim());
        panchayat.setBlock(request.block().trim());
        panchayat.setState(request.state().trim());
        if (request.active() != null) {
            panchayat.setActive(request.active());
        }

        Panchayat updated = panchayatRepository.save(panchayat);
        return PanchayatResponse.from(updated);
    }

    @Transactional
    public void deactivatePanchayat(Long id, CustomUserPrincipal currentUser) {
        if (currentUser.getRole() != Role.ADMIN) {
            throw new ForbiddenOperationException("Access denied: Only system administrators can deactivate Panchayats.");
        }

        Panchayat panchayat = panchayatRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Panchayat not found with id: " + id));

        // Soft deactivation to protect data integrity and avoid orphan states
        panchayat.setActive(false);
        panchayatRepository.save(panchayat);
    }
}
