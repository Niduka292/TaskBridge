package com.taskbridge.userservice.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateProfileRequest {
    private String fullName;
    private String bio;
    private String[] skills;
    private String avatarUrl;
}