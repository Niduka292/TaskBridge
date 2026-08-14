package com.taskbridge.paymentservice.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "escrow_transactions")
public class EscrowTransaction {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "task_id", nullable = false, unique = true)
    private UUID taskId;

    @Column(name = "payer_id", nullable = false)
    private UUID payerId;

    @Column(name = "payee_id", nullable = false)
    private UUID payeeId;

    @Column(name = "amount_lkr", nullable = false, precision = 12, scale = 2)
    private BigDecimal amountLkr;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private EscrowStatus status = EscrowStatus.PENDING;

    @Column(name = "gateway_ref")
    private String gatewayRef;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    // getters and setters

    public UUID getId() { return id; }
    public UUID getTaskId() { return taskId; }
    public void setTaskId(UUID taskId) { this.taskId = taskId; }
    public UUID getPayerId() { return payerId; }
    public void setPayerId(UUID payerId) { this.payerId = payerId; }
    public UUID getPayeeId() { return payeeId; }
    public void setPayeeId(UUID payeeId) { this.payeeId = payeeId; }
    public BigDecimal getAmountLkr() { return amountLkr; }
    public void setAmountLkr(BigDecimal amountLkr) { this.amountLkr = amountLkr; }
    public EscrowStatus getStatus() { return status; }
    public void setStatus(EscrowStatus status) { this.status = status; }
    public String getGatewayRef() { return gatewayRef; }
    public void setGatewayRef(String gatewayRef) { this.gatewayRef = gatewayRef; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}