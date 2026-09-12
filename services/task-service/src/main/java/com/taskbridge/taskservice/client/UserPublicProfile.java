package com.taskbridge.taskservice.client;

import java.util.UUID;

public record UserPublicProfile(
        UUID id,
        String fullName,
        String avatarUrl
) {
}