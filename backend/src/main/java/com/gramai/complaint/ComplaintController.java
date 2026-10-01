package com.gramai.complaint;

import com.gramai.auth.security.CustomUserPrincipal;
import com.gramai.common.dto.PageResponse;
import com.gramai.complaint.dto.*;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

@RestController
@RequestMapping("/api/v1/complaints")
public class ComplaintController {

    private final ComplaintService complaintService;

    public ComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETARY', 'GRS', 'CITIZEN')")
    public ResponseEntity<ComplaintResponse> createComplaint(
            @Valid @RequestBody CreateComplaintRequest request,
            @AuthenticationPrincipal CustomUserPrincipal currentUser
    ) {
        ComplaintResponse response = complaintService.createComplaint(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<PageResponse<ComplaintResponse>> getComplaints(
            @RequestParam(required = false) Long panchayatId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ComplaintStatus status,
            @RequestParam(required = false) ComplaintCategory category,
            @RequestParam(required = false) ComplaintPriority priority,
            @RequestParam(required = false) Long assignedTo,
            @RequestParam(required = false) Long citizenId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @AuthenticationPrincipal CustomUserPrincipal currentUser
    ) {
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new IllegalArgumentException("fromDate cannot be after toDate");
        }

        Instant fromInstant = fromDate != null ? fromDate.atStartOfDay(ZoneOffset.UTC).toInstant() : null;
        Instant toInstant = toDate != null ? toDate.atTime(23, 59, 59, 999_999_999).atZone(ZoneOffset.UTC).toInstant() : null;

        int safePage = Math.max(0, page);
        int safeSize = Math.min(100, Math.max(1, size));
        Sort safeSort = complaintService.sanitizeSort(sort);
        Pageable pageable = PageRequest.of(safePage, safeSize, safeSort);

        PageResponse<ComplaintResponse> response = complaintService.getComplaints(
                panchayatId,
                search,
                status,
                category,
                priority,
                assignedTo,
                citizenId,
                fromInstant,
                toInstant,
                pageable,
                currentUser
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/summary")
    public ResponseEntity<ComplaintSummaryResponse> getSummary(
            @RequestParam(required = false) Long panchayatId,
            @AuthenticationPrincipal CustomUserPrincipal currentUser
    ) {
        ComplaintSummaryResponse summary = complaintService.getSummary(panchayatId, currentUser);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ComplaintResponse> getComplaintById(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserPrincipal currentUser
    ) {
        ComplaintResponse response = complaintService.getComplaintById(id, currentUser);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<ComplaintHistoryResponse>> getComplaintHistory(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserPrincipal currentUser
    ) {
        List<ComplaintHistoryResponse> history = complaintService.getComplaintHistory(id, currentUser);
        return ResponseEntity.ok(history);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETARY', 'GRS')")
    public ResponseEntity<ComplaintResponse> updateComplaint(
            @PathVariable Long id,
            @Valid @RequestBody UpdateComplaintRequest request,
            @AuthenticationPrincipal CustomUserPrincipal currentUser
    ) {
        ComplaintResponse response = complaintService.updateComplaint(id, request, currentUser);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETARY', 'GRS')")
    public ResponseEntity<ComplaintResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateComplaintStatusRequest request,
            @AuthenticationPrincipal CustomUserPrincipal currentUser
    ) {
        ComplaintResponse response = complaintService.updateStatus(id, request, currentUser);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETARY')")
    public ResponseEntity<ComplaintResponse> assignComplaint(
            @PathVariable Long id,
            @Valid @RequestBody AssignComplaintRequest request,
            @AuthenticationPrincipal CustomUserPrincipal currentUser
    ) {
        ComplaintResponse response = complaintService.assignComplaint(id, request, currentUser);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETARY', 'GRS')")
    public ResponseEntity<ComplaintResponse> resolveComplaint(
            @PathVariable Long id,
            @Valid @RequestBody ResolveComplaintRequest request,
            @AuthenticationPrincipal CustomUserPrincipal currentUser
    ) {
        ComplaintResponse response = complaintService.resolveComplaint(id, request, currentUser);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETARY')")
    public ResponseEntity<ComplaintResponse> closeComplaint(
            @PathVariable Long id,
            @RequestBody(required = false) CloseComplaintRequest request,
            @AuthenticationPrincipal CustomUserPrincipal currentUser
    ) {
        ComplaintResponse response = complaintService.closeComplaint(id, request, currentUser);
        return ResponseEntity.ok(response);
    }
}
