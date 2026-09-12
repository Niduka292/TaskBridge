package com.taskbridge.paymentservice.controller;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.taskbridge.paymentservice.dto.EscrowResponse;
import com.taskbridge.paymentservice.model.EscrowTransaction;
import com.taskbridge.paymentservice.service.EscrowService;

@RestController
@RequestMapping("/api/v1/escrow")
public class EscrowController {

    private final EscrowService escrowService;

    public EscrowController(EscrowService escrowService) {
        this.escrowService = escrowService;
    }

    @GetMapping("/{escrowId}")
    public ResponseEntity<EscrowResponse> get(@PathVariable UUID escrowId, Authentication auth) {
        UUID requesterId = UUID.fromString(auth.getName()); // set by your JWT filter — see SecurityConfig note below

        try {
            EscrowTransaction escrow = escrowService.getForUser(escrowId, requesterId);
            return ResponseEntity.ok(toResponse(escrow));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @PostMapping("/{escrowId}/release")
    public ResponseEntity<EscrowResponse> release(@PathVariable UUID escrowId, Authentication auth) {
        UUID requesterId = UUID.fromString(auth.getName());

        try {
            EscrowTransaction escrow = escrowService.release(escrowId, requesterId);
            return ResponseEntity.ok(toResponse(escrow));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(null);
        }
    }

    private EscrowResponse toResponse(EscrowTransaction e) {
        return new EscrowResponse(
                e.getId(), e.getTaskId(), e.getPayerId(), e.getPayeeId(),
                e.getAmountLkr(), e.getStatus(), e.getCreatedAt(), e.getUpdatedAt()
        );
    }
}