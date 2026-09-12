package com.taskbridge.taskservice.event;

import java.util.UUID;

public record TaskCompletedEvent(
        UUID taskId,
        UUID posterId,
        UUID freelancerId
) {}