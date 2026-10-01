package com.gramai.auth;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Development & security verification controller for testing Role-Based Access Control (RBAC).
 * These endpoints contain no business functionality and are used strictly for permission verification.
 */
@RestController
@RequestMapping("/api/v1/test")
public class SecurityTestController {

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> adminOnly() {
        return ResponseEntity.ok(Map.of(
                "access", "granted",
                "requiredRole", "ROLE_ADMIN",
                "message", "Verification passed: ADMIN access confirmed"
        ));
    }

    @GetMapping("/secretary")
    @PreAuthorize("hasRole('SECRETARY')")
    public ResponseEntity<Map<String, String>> secretaryOnly() {
        return ResponseEntity.ok(Map.of(
                "access", "granted",
                "requiredRole", "ROLE_SECRETARY",
                "message", "Verification passed: SECRETARY access confirmed"
        ));
    }

    @GetMapping("/citizen")
    @PreAuthorize("hasRole('CITIZEN')")
    public ResponseEntity<Map<String, String>> citizenOnly() {
        return ResponseEntity.ok(Map.of(
                "access", "granted",
                "requiredRole", "ROLE_CITIZEN",
                "message", "Verification passed: CITIZEN access confirmed"
        ));
    }
}
