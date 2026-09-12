package com.taskbridge.userservice.services;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.taskbridge.userservice.dto.ReviewRequest;
import com.taskbridge.userservice.dto.ReviewResponse;
import com.taskbridge.userservice.model.Review;
import com.taskbridge.userservice.model.ReviewContext;
import com.taskbridge.userservice.repositories.ProfileRepository;
import com.taskbridge.userservice.repositories.ReviewRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProfileRepository profileRepository;

    public Page<ReviewResponse> getRevealedReviews(
            UUID revieweeId,
            ReviewContext context,
            Pageable pageable
    ) {
        Page<Review> reviews = (context != null)
                ? reviewRepository.findByRevieweeIdAndContextAndRevealedTrue(
                        revieweeId, context.name(), pageable)
                : reviewRepository.findByRevieweeIdAndRevealedTrue(revieweeId, pageable);

        return reviews.map(this::toResponse);
    }

    @Transactional
    public ReviewResponse submitReview(
            UUID reviewerId,
            UUID revieweeId,
            ReviewRequest request
    ) {
        // prevent duplicate review for same task
        if (reviewRepository.existsByReviewerIdAndTaskId(reviewerId, request.getTaskId())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "You have already reviewed this task");
        }

        Review review = Review.builder()
                .taskId(request.getTaskId())
                .reviewerId(reviewerId)
                .revieweeId(revieweeId)
                .context(request.getContext())
                .rating(request.getRating())
                .comment(request.getComment())
                .revealed(false)
                .createdAt(OffsetDateTime.now())
                .build();

        reviewRepository.save(review);

        // check if the counterpart (other party) has already submitted their review
        Optional<Review> counterpart = reviewRepository.findCounterpart(
                request.getTaskId(), reviewerId);

        if (counterpart.isPresent()) {
            // both sides submitted — reveal both reviews
            review.setRevealed(true);
            counterpart.get().setRevealed(true);
            reviewRepository.save(review);
            reviewRepository.save(counterpart.get());

            // recalculate avg ratings for both parties
            recalculateRating(revieweeId, request.getContext());
            recalculateRating(reviewerId, oppositeContext(request.getContext()));
        }

        return toResponse(review);
    }

    // --- helpers ---

    private void recalculateRating(UUID userId, ReviewContext context) {
        profileRepository.findById(userId).ifPresent(profile -> {
            double avg = reviewRepository
                    .findByRevieweeIdAndContextAndRevealedTrue(
                            userId, context.name(), Pageable.unpaged())
                    .stream()
                    .mapToInt(Review::getRating)
                    .average()
                    .orElse(0.0);

            if (context == ReviewContext.AS_POSTER) {
                profile.setAvgRatingAsPoster(avg);
            } else {
                profile.setAvgRatingAsFreelancer(avg);
            }
            profileRepository.save(profile);
        });
    }

    private ReviewContext oppositeContext(ReviewContext context) {
        return context == ReviewContext.AS_POSTER
                ? ReviewContext.AS_FREELANCER
                : ReviewContext.AS_POSTER;
    }

    private ReviewResponse toResponse(Review review) {
        ReviewResponse response = new ReviewResponse();
        response.setId(review.getId());
        response.setTaskId(review.getTaskId());
        response.setReviewerId(review.getReviewerId());
        response.setRevieweeId(review.getRevieweeId());
        response.setContext(review.getContext());
        response.setRating(review.getRevealed() ? review.getRating() : null); // hide rating until revealed
        response.setComment(review.getRevealed() ? review.getComment() : null);
        response.setRevealed(review.getRevealed());
        response.setCreatedAt(review.getCreatedAt());
        return response;
    }
}