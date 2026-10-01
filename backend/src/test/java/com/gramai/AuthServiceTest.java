package com.gramai;

import com.gramai.auth.AuthService;
import com.gramai.auth.dto.AuthResponse;
import com.gramai.auth.dto.LoginRequest;
import com.gramai.auth.security.JwtUtils;
import com.gramai.user.Role;
import com.gramai.user.User;
import com.gramai.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserRepository userRepository;

    private JwtUtils jwtUtils;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        jwtUtils = new JwtUtils();
        ReflectionTestUtils.setField(jwtUtils, "jwtSecret", "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970337336763979244226452948404D635166546A576E5A7234753778214125442A");
        ReflectionTestUtils.setField(jwtUtils, "jwtExpirationMs", 3600000L);
        authService = new AuthService(authenticationManager, userRepository, jwtUtils);
    }

    @Test
    @DisplayName("Successful login should return JWT and safe user details")
    void testSuccessfulLogin() {
        LoginRequest request = new LoginRequest("secretary@gramai.in", "Password@123");
        User user = new User("Rameshwar Sharma", "secretary@gramai.in", "9876543211", "hashed", Role.SECRETARY, 1L);
        user.setId(10L);

        UsernamePasswordAuthenticationToken authToken =
                new UsernamePasswordAuthenticationToken("secretary@gramai.in", null, Collections.emptyList());

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authToken);
        when(userRepository.findByEmail("secretary@gramai.in")).thenReturn(Optional.of(user));

        AuthResponse response = authService.login(request);

        assertThat(response).isNotNull();
        assertThat(response.token()).isNotBlank();
        assertThat(jwtUtils.validateToken(response.token())).isTrue();
        assertThat(response.user().id()).isEqualTo(10L);
        assertThat(response.user().email()).isEqualTo("secretary@gramai.in");
        assertThat(response.user().role()).isEqualTo("SECRETARY");
        assertThat(response.user().panchayatId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("Invalid password should throw BadCredentialsException with generic message")
    void testInvalidPasswordThrowsException() {
        LoginRequest request = new LoginRequest("secretary@gramai.in", "WrongPassword");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid email or password");
    }

    @Test
    @DisplayName("Unknown user should throw BadCredentialsException with generic message")
    void testUnknownUserThrowsException() {
        LoginRequest request = new LoginRequest("unknown@gramai.in", "Password@123");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid email or password");
    }

    @Test
    @DisplayName("Inactive user should be rejected with generic authentication error")
    void testInactiveUserRejected() {
        LoginRequest request = new LoginRequest("inactive@gramai.in", "Password@123");
        User inactiveUser = new User("Inactive Staff", "inactive@gramai.in", "9876543216", "hashed", Role.SECRETARY, 1L);
        inactiveUser.setActive(false);

        UsernamePasswordAuthenticationToken authToken =
                new UsernamePasswordAuthenticationToken("inactive@gramai.in", null, Collections.emptyList());

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authToken);
        when(userRepository.findByEmail("inactive@gramai.in")).thenReturn(Optional.of(inactiveUser));

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid email or password");
    }
}
