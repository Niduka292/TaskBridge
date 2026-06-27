package com.taskbridge.userservice.services;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.taskbridge.userservice.dto.ProfileResponse;
import com.taskbridge.userservice.dto.UpdateProfileRequest;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    // Returns the caller's profile; balance is included only if callerId == userId
    public ProfileResponse getProfile(UUID callerId, UUID userId) {
        // TODO: implement in service layer step
        throw new UnsupportedOperationException("Not implemented yet");
    }

    // Returns 403 if callerId != userId — enforced inside this method
    public ProfileResponse updateProfile(UUID callerId, UUID userId, UpdateProfileRequest request) {
        // TODO: implement in service layer step
        throw new UnsupportedOperationException("Not implemented yet");
    }
}