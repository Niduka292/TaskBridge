package com.taskbridge.taskservice.event;

import java.time.Instant;
import java.util.UUID;

public record DeadlineApproachingEvent(
        UUID taskId,
        UUID posterId,
        UUID freelancerId,
        Instant deadline
) {}