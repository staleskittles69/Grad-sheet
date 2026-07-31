package com.siaas.security;

import com.siaas.user.Role;
import com.siaas.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private JwtService jwtService;
    private User testUser;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "jwtSecret",
                "siaas-test-secret-key-minimum-32-chars-long-x");
        ReflectionTestUtils.setField(jwtService, "jwtExpiryMs", 900000L);

        testUser = User.builder()
                .email("test@siaas.dev")
                .passwordHash("hash")
                .role(Role.STUDENT)
                .isActive(true)
                .build();
    }

    @Test
    void generateToken_thenExtractUsername_returnsEmail() {
        String token = jwtService.generateAccessToken(testUser);
        assertThat(jwtService.extractUsername(token)).isEqualTo("test@siaas.dev");
    }

    @Test
    void isValid_withValidToken_returnsTrue() {
        String token = jwtService.generateAccessToken(testUser);
        assertThat(jwtService.isValid(token, testUser)).isTrue();
    }

    @Test
    void isValid_withTamperedToken_returnsFalse() {
        String token = jwtService.generateAccessToken(testUser) + "tampered";
        assertThat(jwtService.isValid(token, testUser)).isFalse();
    }

    @Test
    void isValid_withWrongUser_returnsFalse() {
        String token = jwtService.generateAccessToken(testUser);
        User otherUser = User.builder()
                .email("other@siaas.dev")
                .passwordHash("hash")
                .role(Role.STUDENT)
                .isActive(true)
                .build();
        assertThat(jwtService.isValid(token, otherUser)).isFalse();
    }
}
