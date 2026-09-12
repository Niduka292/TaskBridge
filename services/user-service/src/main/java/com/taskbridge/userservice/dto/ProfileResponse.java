package com.taskbridge.userservice.dto;

import java.math.BigDecimal;
import java.util.UUID;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class ProfileResponse {

    private UUID id;

    private String fullName;

    private Double avgRatingAsPoster;

    private Double avgRatingAsFreelancer;

    private Integer completedCount;

    private BigDecimal balance;
}