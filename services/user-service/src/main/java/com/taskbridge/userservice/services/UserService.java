package com.taskbridge.userservice.services;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.taskbridge.userservice.dto.ProfileResponse;
import com.taskbridge.userservice.dto.UpdateProfileRequest;
import com.taskbridge.userservice.model.Profile;
import com.taskbridge.userservice.repositories.ProfileRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final ProfileRepository profileRepository;

    public ProfileResponse getProfile(UUID callerId, UUID userId) {
        Profile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        ProfileResponse.ProfileResponseBuilder builder = ProfileResponse.builder()
                .id(profile.getId())
                .fullName(profile.getFullName())
                .avgRatingAsPoster(profile.getAvgRatingAsPoster())
                .avgRatingAsFreelancer(profile.getAvgRatingAsFreelancer())
                .completedCount(profile.getCompletedTaskCount());

        // balance only visible to the profile owner
        if (callerId.equals(userId)) {
            builder.balance(profile.getBalance());
        }

        return builder.build();
    }

    public ProfileResponse updateProfile(UUID callerId, UUID userId, UpdateProfileRequest request) {
        if (!callerId.equals(userId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "You can only update your own profile");
        }

        Profile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        if (request.getFullName() != null) profile.setFullName(request.getFullName());
        if (request.getBio() != null)      profile.setBio(request.getBio());
        if (request.getSkills() != null)   profile.setSkills(request.getSkills());
        if (request.getAvatarUrl() != null) profile.setAvatarUrl(request.getAvatarUrl());

        profileRepository.save(profile);

        return ProfileResponse.builder()
                .id(profile.getId())
                .fullName(profile.getFullName())
                .avgRatingAsPoster(profile.getAvgRatingAsPoster())
                .avgRatingAsFreelancer(profile.getAvgRatingAsFreelancer())
                .completedCount(profile.getCompletedTaskCount())
                .balance(profile.getBalance()) // owner is updating — balance visible
                .build();
    }
}