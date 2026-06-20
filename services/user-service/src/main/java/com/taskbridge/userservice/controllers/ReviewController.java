package com.taskbridge.userservice.controllers;

import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.taskbridge.userservice.dto.ReviewRequest;
import com.taskbridge.userservice.services.ReviewService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping("/{userId}/reviews")
    public void submitReview(
            @PathVariable UUID userId,
            @Valid @RequestBody ReviewRequest request,
            Authentication authentication
    ) {

        UUID reviewerId =
                UUID.fromString(authentication.getName());

        reviewService.submitReview(
                reviewerId,
                userId,
                request
        );
    }
}
