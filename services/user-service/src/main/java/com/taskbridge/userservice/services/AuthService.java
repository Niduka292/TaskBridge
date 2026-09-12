package com.taskbridge.userservice.services;

import java.time.OffsetDateTime;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import com.taskbridge.userservice.dto.AuthResponse;
import com.taskbridge.userservice.dto.LoginRequest;
import com.taskbridge.userservice.dto.RegisterRequest;
import com.taskbridge.userservice.model.Profile;
import com.taskbridge.userservice.repositories.ProfileRepository;
import com.taskbridge.userservice.security.JwtService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final ProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthResponse register(RegisterRequest request) {
        profileRepository.findByEmail(request.getEmail()).ifPresent(p -> {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        });

        Profile profile = new Profile();
        profile.setId(UUID.randomUUID());
        profile.setEmail(request.getEmail());
        profile.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        profile.setFullName(request.getFullName());
        profile.setCreatedAt(OffsetDateTime.now());

        try {
            profileRepository.save(profile);
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        String token = jwtService.generateToken(profile.getId());
        return new AuthResponse(token, profile.getId(), profile.getFullName());
    }

    public AuthResponse login(LoginRequest request) {
        Profile profile = profileRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), profile.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        String token = jwtService.generateToken(profile.getId());
        return new AuthResponse(token, profile.getId(), profile.getFullName());
    }
}