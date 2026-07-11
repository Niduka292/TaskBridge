package com.taskbridge.userservice.model;

import java.time.OffsetDateTime;
import java.util.UUID;
import jakarta.persistence.EnumType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
@Entity
@Table(name = "reviews")
public class Review {
    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "task_id")
    private UUID taskId;

    @Column(name = "reviewer_id")
    private UUID reviewerId;

    @Column(name = "reviewee_id")
    private UUID revieweeId;

    @Enumerated(EnumType.STRING)
    private ReviewContext context; // AS_POSTER, AS_FREELANCER

    private Integer rating;

    private String comment;

    @Builder.Default
    private Boolean revealed = false;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

}
