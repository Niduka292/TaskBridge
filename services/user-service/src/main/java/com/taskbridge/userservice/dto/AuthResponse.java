// AuthResponse.java
package com.taskbridge.userservice.dto;

import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AuthResponse {
    private String accessToken;
    private UUID userId;
    private String fullName;
}
