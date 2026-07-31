package com.siaas.auth;

import com.siaas.auth.dto.LoginRequest;
import com.siaas.auth.dto.MeResponse;
import com.siaas.auth.dto.RegisterRequest;
import com.siaas.common.ConflictException;
import com.siaas.security.JwtService;
import com.siaas.user.Role;
import com.siaas.user.User;
import com.siaas.user.UserRepository;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseCookie;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JdbcTemplate jdbc;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final AuthenticationManager authenticationManager;
    private final BCryptPasswordEncoder passwordEncoder;

    @Transactional
    public MeResponse login(LoginRequest request, HttpServletResponse response) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password()));

        User user = userRepository.findByEmail(request.email()).orElseThrow();
        issueTokens(user, response);
        return new MeResponse(user.getId(), user.getEmail(), user.getRole());
    }

    @Transactional
    public MeResponse register(RegisterRequest request, HttpServletResponse response) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException("Email already registered");
        }

        User user = User.builder()
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(Role.STUDENT)
                .isVerified(false)
                .isActive(true)
                .build();
        user = userRepository.save(user);

        String deptId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
        jdbc.update(
            "INSERT INTO students (id, user_id, department_id, roll_number, full_name, semester, section, admission_year) " +
            "VALUES (?::uuid, ?::uuid, ?::uuid, ?, ?, 1, 'A', EXTRACT(YEAR FROM NOW())::int)",
            UUID.randomUUID().toString(), user.getId().toString(), deptId,
            request.rollNumber(), request.fullName());

        issueTokens(user, response);
        return new MeResponse(user.getId(), user.getEmail(), user.getRole());
    }

    @Transactional
    public void logout(String rawRefreshToken, HttpServletResponse response) {
        if (rawRefreshToken != null) {
            refreshTokenService.revokeByRawToken(rawRefreshToken);
        }
        clearCookies(response);
    }

    @Transactional
    public MeResponse refresh(String rawRefreshToken, HttpServletResponse response) {
        if (rawRefreshToken == null) {
            throw new IllegalArgumentException("No refresh token");
        }

        RefreshToken old = refreshTokenService.validateAndRevoke(rawRefreshToken)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired refresh token"));

        User user = userRepository.findById(old.getUserId()).orElseThrow();
        issueTokens(user, response);
        return new MeResponse(user.getId(), user.getEmail(), user.getRole());
    }

    public MeResponse me(User user) {
        return new MeResponse(user.getId(), user.getEmail(), user.getRole());
    }

    private void issueTokens(User user, HttpServletResponse response) {
        String accessToken = jwtService.generateAccessToken(user);
        String rawRefreshToken = refreshTokenService.createRefreshToken(user);
        response.addHeader("Set-Cookie", buildCookie("access_token", accessToken, 15 * 60).toString());
        response.addHeader("Set-Cookie", buildCookie("refresh_token", rawRefreshToken, 7 * 24 * 60 * 60).toString());
    }

    private void clearCookies(HttpServletResponse response) {
        response.addHeader("Set-Cookie", buildCookie("access_token", "", 0).toString());
        response.addHeader("Set-Cookie", buildCookie("refresh_token", "", 0).toString());
    }

    private ResponseCookie buildCookie(String name, String value, long maxAgeSeconds) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .path("/")
                .maxAge(maxAgeSeconds)
                .sameSite("Lax")
                .build();
    }
}
