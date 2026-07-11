package com.taskbridge.taskservice.event;

import java.util.UUID;

public record DisputeRaisedEvent(
        UUID taskId,
        UUID posterId,
        UUID freelancerId,
        String reason
) {}