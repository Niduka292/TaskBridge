package com.taskbridge.taskservice.config;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtFilter jwtFilter) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/v1/tasks/*/resolve").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // ---- JWT Filter ----
    @Component
    public static class JwtFilter extends OncePerRequestFilter {

        @Value("${app.jwt.secret}")
        private String jwtSecret;

        @Override
        protected void doFilterInternal(HttpServletRequest request,
                                        HttpServletResponse response,
                                        FilterChain filterChain)
                throws ServletException, IOException {

            String authHeader = request.getHeader("Authorization");

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                filterChain.doFilter(request, response);
                return;
            }

            String token = authHeader.substring(7);

            try {
                SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));

                Claims claims = Jwts.parser()
                        .verifyWith(key)
                        .build()
                        .parseSignedClaims(token)
                        .getPayload();

                // Extract user ID from 'sub' — fail fast if missing or not a valid UUID
                String subject = claims.getSubject();
                if (subject == null) {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    return;
                }
                UUID userId = UUID.fromString(subject);

                // Safe extraction — don't crash if user_metadata is absent
                // user-service may not include this claim
                Map<String, Object> userMetadata = null;
                Object rawMetadata = claims.get("user_metadata");
                if (rawMetadata instanceof Map) {
                    userMetadata = (Map<String, Object>) rawMetadata;
                }

                String fullName  = userMetadata != null ? (String) userMetadata.get("full_name")  : null;
                String avatarUrl = userMetadata != null ? (String) userMetadata.get("avatar_url") : null;

                // Default to ROLE_USER if role claim is absent
                Object rawRole = claims.get("role");
                String role = rawRole instanceof String ? (String) rawRole : null;
                List<SimpleGrantedAuthority> authorities = "admin".equalsIgnoreCase(role)
                        ? List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
                        : List.of(new SimpleGrantedAuthority("ROLE_USER"));

                TaskBridgePrincipal principal = new TaskBridgePrincipal(userId, fullName, avatarUrl);

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(principal, null, authorities);

                SecurityContextHolder.getContext().setAuthentication(authentication);

                filterChain.doFilter(request, response);

            } catch (Exception e) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            }
        }
    }

    // ---- Principal — carries the caller's identity through the request ----
    public static class TaskBridgePrincipal {

        private final UUID userId;
        private final String fullName;
        private final String avatarUrl;

        public TaskBridgePrincipal(UUID userId, String fullName, String avatarUrl) {
            this.userId    = userId;
            this.fullName  = fullName;
            this.avatarUrl = avatarUrl;
        }

        public UUID getUserId()     { return userId;    }
        public String getFullName() { return fullName;  }
        public String getAvatarUrl(){ return avatarUrl; }
    }
}