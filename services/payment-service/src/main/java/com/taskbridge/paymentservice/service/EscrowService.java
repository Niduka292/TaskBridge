package com.taskbridge.paymentservice.service;

import com.taskbridge.paymentservice.model.EscrowStatus;
import com.taskbridge.paymentservice.model.EscrowTransaction;
import com.taskbridge.paymentservice.repository.EscrowRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
public class EscrowService {

    private final EscrowRepository escrowRepository;
    private final EventPublisher eventPublisher;

    public EscrowService(EscrowRepository escrowRepository, EventPublisher eventPublisher) {
        this.escrowRepository = escrowRepository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public EscrowTransaction createPending(UUID taskId, UUID payerId, UUID payeeId, BigDecimal amountLkr) {
        // Defensive check even though task_id is unique at the DB level —
        // fail with a clear error instead of a raw constraint-violation exception.
        escrowRepository.findByTaskId(taskId).ifPresent(existing -> {
            throw new IllegalStateException("Escrow already exists for task " + taskId);
        });

        EscrowTransaction escrow = new EscrowTransaction();
        escrow.setTaskId(taskId);
        escrow.setPayerId(payerId);
        escrow.setPayeeId(payeeId);
        escrow.setAmountLkr(amountLkr);
        escrow.setStatus(EscrowStatus.PENDING);

        return escrowRepository.save(escrow);
    }

    @Transactional
    public EscrowTransaction markHeld(UUID taskId, String gatewayRef) {
        EscrowTransaction escrow = escrowRepository.findByTaskId(taskId)
                .orElseThrow(() -> new IllegalArgumentException("No escrow found for task " + taskId));

        if (escrow.getStatus() != EscrowStatus.PENDING) {
            // Idempotency guard: PayHere may retry the webhook. If we've already
            // processed this, don't re-transition or re-publish.
            return escrow;
        }

        escrow.setStatus(EscrowStatus.HELD);
        escrow.setGatewayRef(gatewayRef);
        EscrowTransaction saved = escrowRepository.save(escrow);

        eventPublisher.publishEscrowHeld(saved);
        return saved;
    }

    @Transactional
    public EscrowTransaction release(UUID escrowId, UUID requesterId) {
        EscrowTransaction escrow = escrowRepository.findById(escrowId)
                .orElseThrow(() -> new IllegalArgumentException("Escrow not found: " + escrowId));

        if (!escrow.getPayerId().equals(requesterId)) {
            throw new SecurityException("Only the poster can release this escrow");
        }
        if (escrow.getStatus() != EscrowStatus.HELD) {
            throw new IllegalStateException("Escrow must be HELD to release, was " + escrow.getStatus());
        }

        escrow.setStatus(EscrowStatus.RELEASED);
        EscrowTransaction saved = escrowRepository.save(escrow);

        eventPublisher.publishEscrowReleased(saved);
        return saved;
    }

    @Transactional
    public EscrowTransaction refund(UUID taskId) {
        EscrowTransaction escrow = escrowRepository.findByTaskId(taskId)
                .orElseThrow(() -> new IllegalArgumentException("No escrow found for task " + taskId));

        if (escrow.getStatus() != EscrowStatus.HELD) {
            throw new IllegalStateException("Escrow must be HELD to refund, was " + escrow.getStatus());
        }

        escrow.setStatus(EscrowStatus.REFUNDED);
        EscrowTransaction saved = escrowRepository.save(escrow);

        eventPublisher.publishEscrowRefunded(saved);
        return saved;
    }

    public EscrowTransaction getForUser(UUID escrowId, UUID requesterId) {
        EscrowTransaction escrow = escrowRepository.findById(escrowId)
                .orElseThrow(() -> new IllegalArgumentException("Escrow not found: " + escrowId));

        if (!escrow.getPayerId().equals(requesterId) && !escrow.getPayeeId().equals(requesterId)) {
            throw new SecurityException("Not authorized to view this escrow");
        }
        return escrow;
    }
}