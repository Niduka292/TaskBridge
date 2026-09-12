package com.taskbridge.paymentservice.dto;

import java.util.UUID;

public class PaymentInitiateRequest {
    private UUID taskId;

    public UUID getTaskId() { return taskId; }
    public void setTaskId(UUID taskId) { this.taskId = taskId; }
}
