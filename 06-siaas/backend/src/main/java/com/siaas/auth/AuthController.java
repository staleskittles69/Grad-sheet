package com.siaas.auth;

import com.siaas.auth.dto.LoginRequest;
import com.siaas.auth.dto.MeResponse;
import com.siaas.auth.dto.RegisterRequest;
import com.siaas.common.ApiResponse;
import com.siaas.user.User;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<MeResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {
        MeResponse me = authService.login(request, response);
        return ResponseEntity.ok(ApiResponse.ok("Login successful", me));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<MeResponse>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletResponse response) {
        MeResponse me = authService.register(request, response);
        return ResponseEntity.ok(ApiResponse.ok("Registration successful", me));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            HttpServletRequest request,
            HttpServletResponse response) {
        String rawRefreshToken = extractCookie(request, "refresh_token");
        authService.logout(rawRefreshToken, response);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<MeResponse>> refresh(
            HttpServletRequest request,
            HttpServletResponse response) {
        String rawRefreshToken = extractCookie(request, "refresh_token");
        MeResponse me = authService.refresh(rawRefreshToken, response);
        return ResponseEntity.ok(ApiResponse.ok("Token refreshed", me));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<MeResponse>> me(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(authService.me(user)));
    }

    private String extractCookie(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        return Arrays.stream(cookies)
                .filter(c -> name.equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }
}
