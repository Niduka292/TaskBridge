package com.taskbridge.userservice.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateProfileRequest {
    private String fullName;
    private String bio;
    private List<String> skills;
    private String avatarUrl;
}