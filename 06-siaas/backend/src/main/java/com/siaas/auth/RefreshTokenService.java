package com.siaas.auth;

import com.siaas.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${jwt.refresh-token-days}")
    private long refreshTokenDays;

    @Transactional
    public String createRefreshToken(User user) {
        String raw = UUID.randomUUID().toString();
        String hash = sha256(raw);

        RefreshToken token = RefreshToken.builder()
                .userId(user.getId())
                .tokenHash(hash)
                .expiresAt(Instant.now().plus(refreshTokenDays, ChronoUnit.DAYS))
                .build();

        refreshTokenRepository.save(token);
        return raw;
    }

    @Transactional
    public Optional<RefreshToken> validateAndRevoke(String rawToken) {
        String hash = sha256(rawToken);
        Optional<RefreshToken> found = refreshTokenRepository.findByTokenHash(hash);

        if (found.isEmpty()) return Optional.empty();

        RefreshToken token = found.get();
        if (token.isRevoked() || token.getExpiresAt().isBefore(Instant.now())) {
            return Optional.empty();
        }

        token.setRevoked(true);
        refreshTokenRepository.save(token);
        return Optional.of(token);
    }

    @Transactional
    public void revokeByRawToken(String rawToken) {
        String hash = sha256(rawToken);
        refreshTokenRepository.findByTokenHash(hash).ifPresent(t -> {
            t.setRevoked(true);
            refreshTokenRepository.save(t);
        });
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(bytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
