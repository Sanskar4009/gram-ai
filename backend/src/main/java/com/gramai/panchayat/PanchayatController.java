package com.gramai.panchayat;

import com.gramai.auth.security.CustomUserPrincipal;
import com.gramai.common.dto.PageResponse;
import com.gramai.panchayat.dto.CreatePanchayatRequest;
import com.gramai.panchayat.dto.PanchayatResponse;
import com.gramai.panchayat.dto.UpdatePanchayatRequest;
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
@RequestMapping("/api/v1/panchayats")
public class PanchayatController {

    private final PanchayatService panchayatService;

    public PanchayatController(PanchayatService panchayatService) {
        this.panchayatService = panchayatService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PanchayatResponse> createPanchayat(
            @Valid @RequestBody CreatePanchayatRequest request
    ) {
        PanchayatResponse response = panchayatService.createPanchayat(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<PageResponse<PanchayatResponse>> getPanchayats(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal CustomUserPrincipal currentUser
    ) {
        // Enforce safe bounds on pagination
        int safePage = Math.max(0, page);
        int safeSize = Math.min(100, Math.max(1, size));
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by("createdAt").descending());

        PageResponse<PanchayatResponse> response = panchayatService.getPanchayats(search, pageable, currentUser);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PanchayatResponse> getPanchayatById(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserPrincipal currentUser
    ) {
        PanchayatResponse response = panchayatService.getPanchayatById(id, currentUser);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PanchayatResponse> updatePanchayat(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePanchayatRequest request,
            @AuthenticationPrincipal CustomUserPrincipal currentUser
    ) {
        PanchayatResponse response = panchayatService.updatePanchayat(id, request, currentUser);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deactivatePanchayat(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserPrincipal currentUser
    ) {
        panchayatService.deactivatePanchayat(id, currentUser);
        return ResponseEntity.noContent().build();
    }
}
