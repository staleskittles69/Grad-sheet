package com.siaas.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.siaas.auth.dto.LoginRequest;
import com.siaas.auth.dto.MeResponse;
import com.siaas.auth.dto.RegisterRequest;
import com.siaas.common.ConflictException;
import com.siaas.security.JwtService;
import com.siaas.security.SecurityConfig;
import com.siaas.security.UserDetailsServiceImpl;
import com.siaas.user.Role;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@Import(SecurityConfig.class)
class AuthControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean AuthService authService;
    @MockBean JwtService jwtService;
    @MockBean UserDetailsServiceImpl userDetailsService;

    private final UUID userId = UUID.randomUUID();

    @Test
    void login_withValidCredentials_returns200() throws Exception {
        LoginRequest req = new LoginRequest("student@siaas.dev", "Student@123");
        MeResponse me = new MeResponse(userId, "student@siaas.dev", Role.STUDENT);
        when(authService.login(any(), any())).thenReturn(me);

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("student@siaas.dev"))
                .andExpect(jsonPath("$.data.role").value("STUDENT"));
    }

    @Test
    void login_withBlankEmail_returns400() throws Exception {
        LoginRequest req = new LoginRequest("", "password");

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_withDuplicateEmail_returns409() throws Exception {
        RegisterRequest req = new RegisterRequest(
                "student@siaas.dev", "Password1", "Test User", "CS21B001", null);
        when(authService.register(any(), any())).thenThrow(new ConflictException("Email already registered"));

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict());
    }

    @Test
    @WithMockUser(username = "student@siaas.dev", roles = "STUDENT")
    void me_whenAuthenticated_returns200() throws Exception {
        MeResponse me = new MeResponse(userId, "student@siaas.dev", Role.STUDENT);
        when(authService.me(any())).thenReturn(me);

        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("student@siaas.dev"));
    }

    @Test
    void me_whenNotAuthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized());
    }
}
