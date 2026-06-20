package com.taskbridge.userservice.services;

import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.taskbridge.userservice.dto.ReviewRequest;
import com.taskbridge.userservice.model.Review;
import com.taskbridge.userservice.repositories.ReviewRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;

    public void submitReview(
            UUID reviewerId,
            UUID revieweeId,
            ReviewRequest request
    ) {

        boolean alreadyReviewed =
                reviewRepository.existsByReviewerIdAndTaskId(
                        reviewerId,
                        request.getTaskId()
                );

        if (alreadyReviewed) {
            throw new RuntimeException("Already reviewed");
        }

        Review review = Review.builder()
                .reviewerId(reviewerId)
                .revieweeId(revieweeId)
                .taskId(request.getTaskId())
                .rating(request.getRating())
                .comment(request.getComment())
                .context(request.getContext())
                .revealed(false)
                .build();

        reviewRepository.save(review);

        Optional<Review> counterpart =
                reviewRepository.findCounterpart(
                        request.getTaskId(),
                        reviewerId
                );

        if (counterpart.isPresent()) {

            review.setRevealed(true);

            Review other = counterpart.get();
            other.setRevealed(true);

            reviewRepository.save(review);
            reviewRepository.save(other);
        }
    }
}
