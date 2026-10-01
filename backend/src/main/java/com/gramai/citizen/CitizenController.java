package com.gramai.citizen;

import com.gramai.auth.security.CustomUserPrincipal;
import com.gramai.common.dto.PageResponse;
import com.gramai.citizen.dto.CreateCitizenRequest;
import com.gramai.citizen.dto.UpdateCitizenRequest;
import com.gramai.citizen.dto.UpdateCitizenStatusRequest;
import com.gramai.citizen.dto.CitizenResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/citizens")
public class CitizenController {

    private final CitizenService citizenService;

    public CitizenController(CitizenService citizenService) {
        this.citizenService = citizenService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETARY')")
    public ResponseEntity<CitizenResponse> createCitizen(
            @Valid @RequestBody CreateCitizenRequest request,
            @AuthenticationPrincipal CustomUserPrincipal currentUser
    ) {
        CitizenResponse response = citizenService.createCitizen(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<PageResponse<CitizenResponse>> getCitizens(
            @RequestParam(required = false) Long panchayatId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String village,
            @RequestParam(required = false) Integer wardNumber,
            @RequestParam(required = false) CitizenStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @AuthenticationPrincipal CustomUserPrincipal currentUser
    ) {
        int safePage = Math.max(0, page);
        int safeSize = Math.min(100, Math.max(1, size));
        Sort safeSort = citizenService.sanitizeSort(sort);
        Pageable pageable = PageRequest.of(safePage, safeSize, safeSort);

        PageResponse<CitizenResponse> response = citizenService.getCitizens(
                panchayatId,
                search,
                village,
                wardNumber,
                status,
                pageable,
                currentUser
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CitizenResponse> getCitizenById(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserPrincipal currentUser
    ) {
        CitizenResponse response = citizenService.getCitizenById(id, currentUser);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETARY')")
    public ResponseEntity<CitizenResponse> updateCitizen(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCitizenRequest request,
            @AuthenticationPrincipal CustomUserPrincipal currentUser
    ) {
        CitizenResponse response = citizenService.updateCitizen(id, request, currentUser);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETARY')")
    public ResponseEntity<CitizenResponse> updateCitizenStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCitizenStatusRequest request,
            @AuthenticationPrincipal CustomUserPrincipal currentUser
    ) {
        CitizenResponse response = citizenService.updateCitizenStatus(id, request.resolvedStatus(), currentUser);
        return ResponseEntity.ok(response);
    }
}
