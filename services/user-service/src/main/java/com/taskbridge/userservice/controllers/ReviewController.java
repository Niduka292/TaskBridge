package com.taskbridge.userservice.controllers;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.taskbridge.userservice.dto.ReviewRequest;
import com.taskbridge.userservice.dto.ReviewResponse;
import com.taskbridge.userservice.model.ReviewContext;
import com.taskbridge.userservice.services.ReviewService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/{userId}/reviews")
    public Page<ReviewResponse> getReviews(
            @PathVariable UUID userId,
            @RequestParam(required = false) ReviewContext context,
            Pageable pageable,
            Authentication authentication
    ) {
        return reviewService.getRevealedReviews(userId, context, pageable);
    }

    @PostMapping("/{userId}/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewResponse submitReview(
            @PathVariable UUID userId,
            @Valid @RequestBody ReviewRequest request,
            Authentication authentication
    ) {
        UUID reviewerId = UUID.fromString(authentication.getName());
        return reviewService.submitReview(reviewerId, userId, request);
    }
}