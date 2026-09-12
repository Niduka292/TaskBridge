package com.taskbridge.userservice.dto;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class PublicProfileResponse {
    private UUID id;
    private String fullName;
    private String avatarUrl;
}