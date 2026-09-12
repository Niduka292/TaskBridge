package com.taskbridge.taskservice.event;

import java.util.UUID;

public record WorkSubmittedEvent(
        UUID taskId,
        UUID posterId,
        UUID freelancerId
) {}