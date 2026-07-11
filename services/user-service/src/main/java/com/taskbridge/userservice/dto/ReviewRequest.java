package com.taskbridge.userservice.dto;

import com.taskbridge.userservice.model.ReviewContext;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class ReviewRequest {

@NotNull
private UUID taskId;

@NotNull
private ReviewContext context;

@Min(1)
@Max(5)
private Integer rating;

private String comment;

}