package com.taskbridge.taskservice.event;

import java.util.UUID;

public record DisputeResolvedEvent(
        UUID taskId,
        String escrowAction
) {}