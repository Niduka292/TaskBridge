package com.taskbridge.userservice.controllers;

import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.taskbridge.userservice.dto.ProfileResponse;
import com.taskbridge.userservice.dto.UpdateProfileRequest;
import com.taskbridge.userservice.services.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/{userId}")
    public ProfileResponse getProfile(
            @PathVariable UUID userId,
            Authentication authentication
    ) {
        UUID callerId = UUID.fromString(authentication.getName());
        return userService.getProfile(callerId, userId);
    }

    @PutMapping("/{userId}")
    public ProfileResponse updateProfile(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateProfileRequest request,
            Authentication authentication
    ) {
        UUID callerId = UUID.fromString(authentication.getName());
        return userService.updateProfile(callerId, userId, request);
    }
}