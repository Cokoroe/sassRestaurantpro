package com.sassfnb.config.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.time.OffsetDateTime;
import java.util.*;

@Component
public class JwtService {

    private final Key key;
    private final int accessMinutes;

    public JwtService(@Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.access-token-minutes}") int accessMinutes) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
        this.accessMinutes = accessMinutes;
    }

    public String generateAccess(UUID userId,
            UUID tenantId,
            String email,
            Collection<String> roles) {

        OffsetDateTime now = OffsetDateTime.now();

        JwtBuilder builder = Jwts.builder()
                .setSubject(userId.toString())
                .claim("email", email)
                .claim("roles", roles == null ? List.of() : roles)
                .setIssuedAt(Date.from(now.toInstant()))
                .setExpiration(Date.from(now.plusMinutes(accessMinutes).toInstant()))
                .signWith(key, SignatureAlgorithm.HS256);

        if (tenantId != null) {
            builder.claim("tenantId", tenantId.toString());
        }

        return builder.compact();
    }

    public Jws<Claims> parse(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token);
    }
}
