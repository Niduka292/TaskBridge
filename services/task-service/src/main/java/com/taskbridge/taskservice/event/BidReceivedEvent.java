package com.taskbridge.taskservice.event;

import java.math.BigDecimal;
import java.util.UUID;

public record BidReceivedEvent(
        UUID taskId,
        String taskTitle,
        UUID posterId,
        UUID bidderId,
        String bidderName,
        BigDecimal amountLkr
) {}