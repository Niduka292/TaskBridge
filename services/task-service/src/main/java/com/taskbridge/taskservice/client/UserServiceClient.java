package com.taskbridge.taskservice.client;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class UserServiceClient {

    private final RestClient restClient;

    public UserServiceClient(
            RestClient.Builder builder,
            @Value("${user-service.base-url:http://localhost:8001}")
            String baseUrl
    ) {
        this.restClient = builder
                .baseUrl(baseUrl)
                .build();
    }

    public UserPublicProfile getUser(UUID userId) {
        return restClient.get()
                .uri("/api/v1/users/{id}/public", userId)
                .retrieve()
                .body(UserPublicProfile.class);
    }
}