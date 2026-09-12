package com.taskbridge.paymentservice.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import com.taskbridge.paymentservice.model.EscrowStatus;

public class EscrowResponse {
    private UUID id;
    private UUID taskId;
    private UUID payerId;
    private UUID payeeId;
    private BigDecimal amountLkr;
    private EscrowStatus status;
    private Instant createdAt;
    private Instant updatedAt;

    public EscrowResponse(UUID id, UUID taskId, UUID payerId, UUID payeeId,
                           BigDecimal amountLkr, EscrowStatus status,
                           Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.taskId = taskId;
        this.payerId = payerId;
        this.payeeId = payeeId;
        this.amountLkr = amountLkr;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() { return id; }
    public UUID getTaskId() { return taskId; }
    public UUID getPayerId() { return payerId; }
    public UUID getPayeeId() { return payeeId; }
    public BigDecimal getAmountLkr() { return amountLkr; }
    public EscrowStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}