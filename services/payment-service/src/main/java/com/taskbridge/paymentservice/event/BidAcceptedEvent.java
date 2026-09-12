package com.taskbridge.paymentservice.event;

import java.math.BigDecimal;
import java.util.UUID;

public record BidAcceptedEvent(
        UUID taskId,
        UUID bidId,
        UUID posterId,
        UUID freelancerId,
        BigDecimal amountLkr
) {
}