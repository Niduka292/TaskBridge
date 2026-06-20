package com.taskbridge.userservice.services;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.taskbridge.userservice.dto.ProfileResponse;
import com.taskbridge.userservice.model.Profile;
import com.taskbridge.userservice.repositories.ProfileRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final ProfileRepository profileRepository;

    public ProfileResponse getProfile(
            UUID callerId,
            UUID userId
    ) {

        Profile profile = profileRepository.findById(userId)
                .orElseThrow();

        boolean owner = callerId.equals(userId);

        return ProfileResponse.builder()
                .id(profile.getId())
                .fullName(profile.getFullName())
                .completedCount(profile.getCompletedTaskCount())
                .avgRatingAsPoster(profile.getAvgRatingAsFreelancer())
                .avgRatingAsFreelancer(profile.getAvgRatingAsFreelancer())
                .balance(owner ? profile.getBalance() : null)
                .build();
    }
}
