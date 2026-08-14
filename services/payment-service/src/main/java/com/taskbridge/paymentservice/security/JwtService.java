package com.taskbridge.paymentservice.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Component
public class JwtService {

    private final SecretKey signingKey;

    public JwtService(@Value("${app.jwt-secret}") String jwtSecret) {
        // Must be the exact same secret user-service uses to sign tokens.
        this.signingKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public UUID validateAndExtractUserId(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        // Adjust claim name to whatever user-service actually puts in the token —
        // "sub" is the JWT-standard subject claim, commonly the user ID.
        String userId = claims.getSubject();
        return UUID.fromString(userId);
    }
}