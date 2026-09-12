package com.taskbridge.userservice.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.taskbridge.userservice.model.ReviewContext;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReviewResponse {
    private UUID id;
    private UUID taskId;
    private UUID reviewerId;
    private UUID revieweeId;
    private ReviewContext context;
    private Integer rating;
    private String comment;
    private Boolean revealed;
    private OffsetDateTime createdAt;
}