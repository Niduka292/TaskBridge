package com.taskbridge.paymentservice.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.taskbridge.paymentservice.model.EscrowTransaction;

@Component
public class LoggingEventPublisher implements EventPublisher {

    private static final Logger log = LoggerFactory.getLogger(LoggingEventPublisher.class);

    @Override
    public void publishEscrowHeld(EscrowTransaction escrow) {
        log.info("[EVENT] ESCROW_HELD taskId={} payerId={} payeeId={} amountLKR={}",
                escrow.getTaskId(), escrow.getPayerId(), escrow.getPayeeId(), escrow.getAmountLkr());
    }

    @Override
    public void publishEscrowReleased(EscrowTransaction escrow) {
        log.info("[EVENT] ESCROW_RELEASED taskId={} payeeId={} amountLKR={}",
                escrow.getTaskId(), escrow.getPayeeId(), escrow.getAmountLkr());
    }

    @Override
    public void publishEscrowRefunded(EscrowTransaction escrow) {
        log.info("[EVENT] ESCROW_REFUNDED taskId={} payerId={} amountLKR={}",
                escrow.getTaskId(), escrow.getPayerId(), escrow.getAmountLkr());
    }
}