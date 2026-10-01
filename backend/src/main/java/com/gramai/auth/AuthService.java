package com.gramai.auth;

import com.gramai.auth.dto.AuthResponse;
import com.gramai.auth.dto.LoginRequest;
import com.gramai.auth.dto.UserResponse;
import com.gramai.auth.security.JwtUtils;
import com.gramai.user.User;
import com.gramai.user.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;

    public AuthService(AuthenticationManager authenticationManager, UserRepository userRepository, JwtUtils jwtUtils) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.jwtUtils = jwtUtils;
    }

    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(normalizedEmail, request.password())
            );

            User user = userRepository.findByEmail(normalizedEmail)
                    .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

            if (!user.isActive()) {
                // Return generic failure to prevent user/status enumeration
                throw new BadCredentialsException("Invalid email or password");
            }

            String token = jwtUtils.generateToken(
                    user.getId(),
                    user.getEmail(),
                    user.getRole().name(),
                    user.getPanchayatId()
            );

            return new AuthResponse(token, UserResponse.fromUser(user));
        } catch (AuthenticationException e) {
            // Generic authentication failure avoids user enumeration
            throw new BadCredentialsException("Invalid email or password");
        }
    }

    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("User not found"));
        return UserResponse.fromUser(user);
    }
}
