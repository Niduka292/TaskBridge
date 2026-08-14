package com.taskbridge.paymentservice.service;

import com.taskbridge.paymentservice.model.EscrowTransaction;

public interface EventPublisher {
    void publishEscrowHeld(EscrowTransaction escrow);
    void publishEscrowReleased(EscrowTransaction escrow);
    void publishEscrowRefunded(EscrowTransaction escrow);
}