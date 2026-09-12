package com.taskbridge.taskservice.event;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record BidAcceptedEvent(
        UUID taskId,
        UUID bidId,
        String taskTitle,
        UUID posterId,
        UUID winningBidderId,
        List<UUID> rejectedBidderIds,
        BigDecimal amountLkr
) {}
