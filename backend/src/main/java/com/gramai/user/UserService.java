package com.gramai.user;

import com.gramai.auth.security.CustomUserPrincipal;
import com.gramai.common.dto.PageResponse;
import com.gramai.common.exception.DuplicateResourceException;
import com.gramai.common.exception.ForbiddenOperationException;
import com.gramai.common.exception.ResourceNotFoundException;
import com.gramai.panchayat.Panchayat;
import com.gramai.panchayat.PanchayatRepository;
import com.gramai.user.dto.CreateUserRequest;
import com.gramai.user.dto.UpdateUserRequest;
import com.gramai.user.dto.UserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PanchayatRepository panchayatRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository userRepository,
            PanchayatRepository panchayatRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.panchayatRepository = panchayatRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest request, CustomUserPrincipal currentUser) {
        Role creatorRole = currentUser.getRole();

        // Only ADMIN and SECRETARY can create accounts
        if (creatorRole != Role.ADMIN && creatorRole != Role.SECRETARY) {
            throw new ForbiddenOperationException("Access denied: You do not have permission to create users.");
        }

        Long resolvedPanchayatId;

        if (creatorRole == Role.SECRETARY) {
            // Secretary cannot create ADMIN accounts
            if (request.role() == Role.ADMIN) {
                throw new ForbiddenOperationException("Access denied: Secretaries cannot create Administrator accounts.");
            }

            // Secretary cannot create other Secretary accounts
            if (request.role() == Role.SECRETARY) {
                throw new ForbiddenOperationException("Access denied: Secretaries cannot create other Secretary accounts.");
            }

            // Secretary must strictly create users in their own assigned Panchayat
            Long ownPanchayatId = currentUser.getPanchayatId();
            if (ownPanchayatId == null) {
                throw new ForbiddenOperationException("Access denied: Current user is not associated with any Panchayat.");
            }

            if (request.panchayatId() != null && !request.panchayatId().equals(ownPanchayatId)) {
                throw new ForbiddenOperationException("Access denied: You cannot create users for another Panchayat.");
            }

            resolvedPanchayatId = ownPanchayatId;
        } else {
            // ADMIN role
            if (request.role() != Role.ADMIN && request.panchayatId() == null) {
                throw new IllegalArgumentException("Panchayat ID is required for non-ADMIN users.");
            }
            resolvedPanchayatId = request.panchayatId();
        }

        // Validate Panchayat existence if resolvedPanchayatId is specified
        String panchayatName = null;
        if (resolvedPanchayatId != null) {
            Long pid = resolvedPanchayatId;
            Panchayat panchayat = panchayatRepository.findById(pid)
                    .orElseThrow(() -> new ResourceNotFoundException("Panchayat not found with id: " + pid));
            panchayatName = panchayat.getName();
        }

        // Validate email uniqueness
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("User with email '" + request.email() + "' already exists");
        }

        // Validate mobile uniqueness
        String mobile = request.mobile().trim();
        if (userRepository.existsByMobile(mobile)) {
            throw new DuplicateResourceException("User with mobile '" + request.mobile() + "' already exists");
        }

        // Secure password hashing
        String passwordHash = passwordEncoder.encode(request.password());

        User user = new User(
                request.fullName().trim(),
                email,
                mobile,
                passwordHash,
                request.role(),
                resolvedPanchayatId
        );
        user.setActive(true);

        User saved = userRepository.save(user);
        return UserResponse.from(saved, panchayatName);
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id, CustomUserPrincipal currentUser) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        // Enforce Panchayat isolation: non-ADMIN can only view users within their own Panchayat or themselves
        if (currentUser.getRole() != Role.ADMIN) {
            boolean isSelf = currentUser.getId().equals(user.getId());
            boolean isSamePanchayat = currentUser.getPanchayatId() != null
                    && currentUser.getPanchayatId().equals(user.getPanchayatId());

            if (!isSelf && !isSamePanchayat) {
                throw new ForbiddenOperationException("Access denied: You do not have permission to view users outside your Panchayat.");
            }
        }

        String panchayatName = null;
        if (user.getPanchayatId() != null) {
            panchayatName = panchayatRepository.findById(user.getPanchayatId())
                    .map(Panchayat::getName)
                    .orElse(null);
        }

        return UserResponse.from(user, panchayatName);
    }

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> getUsers(
            Long filterPanchayatId,
            String search,
            Pageable pageable,
            CustomUserPrincipal currentUser
    ) {
        Page<User> page;

        if (currentUser.getRole() == Role.ADMIN) {
            if (filterPanchayatId != null) {
                if (search != null && !search.isBlank()) {
                    page = userRepository.searchUsersByPanchayat(filterPanchayatId, search.trim(), pageable);
                } else {
                    page = userRepository.findByPanchayatId(filterPanchayatId, pageable);
                }
            } else {
                if (search != null && !search.isBlank()) {
                    page = userRepository.searchUsers(search.trim(), pageable);
                } else {
                    page = userRepository.findAll(pageable);
                }
            }
        } else {
            // Non-ADMIN (Secretary, Sarpanch, etc.) strictly restricted to their own Panchayat
            Long ownPanchayatId = currentUser.getPanchayatId();
            if (ownPanchayatId == null) {
                Page<UserResponse> empty = new PageImpl<>(Collections.emptyList(), pageable, 0);
                return PageResponse.from(empty);
            }

            // If user explicitly requests another Panchayat, reject with 403 Forbidden
            if (filterPanchayatId != null && !filterPanchayatId.equals(ownPanchayatId)) {
                throw new ForbiddenOperationException("Access denied: You cannot view users belonging to another Panchayat.");
            }

            if (search != null && !search.isBlank()) {
                page = userRepository.searchUsersByPanchayat(ownPanchayatId, search.trim(), pageable);
            } else {
                page = userRepository.findByPanchayatId(ownPanchayatId, pageable);
            }
        }

        // Map users and batch-resolve Panchayat names
        Set<Long> panchayatIds = page.getContent().stream()
                .map(User::getPanchayatId)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toSet());

        Map<Long, String> panchayatNameMap = panchayatRepository.findAllById(panchayatIds).stream()
                .collect(Collectors.toMap(Panchayat::getId, Panchayat::getName));

        Page<UserResponse> mapped = page.map(u ->
                UserResponse.from(u, u.getPanchayatId() != null ? panchayatNameMap.get(u.getPanchayatId()) : null)
        );

        return PageResponse.from(mapped);
    }

    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request, CustomUserPrincipal currentUser) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        Role callerRole = currentUser.getRole();

        // User cannot change their own Panchayat
        if (currentUser.getId().equals(id) && request.panchayatId() != null && !request.panchayatId().equals(user.getPanchayatId())) {
            throw new ForbiddenOperationException("Users cannot change their own Panchayat.");
        }

        // Enforce Panchayat isolation
        if (callerRole != Role.ADMIN) {
            boolean isSamePanchayat = currentUser.getPanchayatId() != null
                    && currentUser.getPanchayatId().equals(user.getPanchayatId());
            if (!isSamePanchayat) {
                throw new ForbiddenOperationException("Access denied: Cannot edit users outside your Panchayat.");
            }

            // Non-ADMIN cannot modify user role
            if (request.role() != null && request.role() != user.getRole()) {
                throw new ForbiddenOperationException("Access denied: Only administrators can modify user roles.");
            }

            // Non-ADMIN cannot reassign Panchayat
            if (request.panchayatId() != null && !request.panchayatId().equals(user.getPanchayatId())) {
                throw new ForbiddenOperationException("Access denied: You cannot change a user's Panchayat.");
            }

            // Non-ADMIN cannot edit ADMIN users
            if (user.getRole() == Role.ADMIN) {
                throw new ForbiddenOperationException("Access denied: Cannot edit administrator accounts.");
            }
        }

        // Validate email uniqueness
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailAndIdNot(email, id)) {
            throw new DuplicateResourceException("User with email '" + request.email() + "' already exists");
        }

        // Validate mobile uniqueness
        String mobile = request.mobile().trim();
        if (userRepository.existsByMobileAndIdNot(mobile, id)) {
            throw new DuplicateResourceException("User with mobile '" + request.mobile() + "' already exists");
        }

        user.setFullName(request.fullName().trim());
        user.setEmail(email);
        user.setMobile(mobile);

        if (callerRole == Role.ADMIN) {
            if (request.role() != null) {
                user.setRole(request.role());
            }
            if (request.panchayatId() != null) {
                if (!panchayatRepository.existsById(request.panchayatId())) {
                    throw new ResourceNotFoundException("Panchayat not found with id: " + request.panchayatId());
                }
                user.setPanchayatId(request.panchayatId());
            }
        }

        User updated = userRepository.save(user);

        String panchayatName = null;
        if (updated.getPanchayatId() != null) {
            panchayatName = panchayatRepository.findById(updated.getPanchayatId())
                    .map(Panchayat::getName)
                    .orElse(null);
        }

        return UserResponse.from(updated, panchayatName);
    }

    @Transactional
    public UserResponse updateUserStatus(Long id, boolean active, CustomUserPrincipal currentUser) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        // Prevent self-deactivation
        if (currentUser.getId().equals(id) && !active) {
            throw new ForbiddenOperationException("You cannot deactivate your own account.");
        }

        // Enforce tenant boundary
        if (currentUser.getRole() != Role.ADMIN) {
            boolean isSamePanchayat = currentUser.getPanchayatId() != null
                    && currentUser.getPanchayatId().equals(user.getPanchayatId());
            if (!isSamePanchayat) {
                throw new ForbiddenOperationException("Access denied: Cannot modify users outside your Panchayat.");
            }

            if (user.getRole() == Role.ADMIN) {
                throw new ForbiddenOperationException("Access denied: Cannot modify administrator status.");
            }
        }

        user.setActive(active);
        User saved = userRepository.save(user);

        String panchayatName = null;
        if (saved.getPanchayatId() != null) {
            panchayatName = panchayatRepository.findById(saved.getPanchayatId())
                    .map(Panchayat::getName)
                    .orElse(null);
        }

        return UserResponse.from(saved, panchayatName);
    }
}
