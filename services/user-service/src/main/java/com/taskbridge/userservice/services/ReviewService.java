package com.taskbridge.userservice.services;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.taskbridge.userservice.dto.ReviewRequest;
import com.taskbridge.userservice.dto.ReviewResponse;
import com.taskbridge.userservice.model.ReviewContext;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReviewService {

    // Returns only revealed reviews, filtered by context if provided
    public Page<ReviewResponse> getRevealedReviews(
            UUID revieweeId,
            ReviewContext context,      // nullable — null means no filter
            Pageable pageable
    ) {
        // TODO: implement in service layer step
        throw new UnsupportedOperationException("Not implemented yet");
    }

    // Returns the saved review (revealed flag will be false until counterpart submits)
    public ReviewResponse submitReview(
            UUID reviewerId,
            UUID revieweeId,
            ReviewRequest request
    ) {
        // TODO: implement in service layer step
        throw new UnsupportedOperationException("Not implemented yet");
    }
}