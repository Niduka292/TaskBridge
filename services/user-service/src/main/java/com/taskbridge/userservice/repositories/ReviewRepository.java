package com.taskbridge.userservice.repositories;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.taskbridge.userservice.model.Review;

public interface ReviewRepository extends JpaRepository<Review, UUID> {
    @Query("""
           SELECT r
           FROM Review r
           WHERE r.taskId = :taskId
           AND r.revieweeId != :revieweeId
           """)
    Optional<Review> findCounterpart(UUID taskId, UUID revieweeId);
    Page<Review> findByRevieweeIdAndRevealedTrue(UUID revieweeId, Pageable pageable);

    boolean existsByReviewerIdAndTaskId(UUID reviewerId, UUID taskId);

    Page<Review> findByRevieweeIdAndContextAndRevealedTrue(
            UUID revieweeId,
            String context,
            Pageable pageable
    );
}
