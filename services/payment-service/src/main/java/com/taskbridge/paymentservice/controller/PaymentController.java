package com.taskbridge.paymentservice.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.taskbridge.paymentservice.dto.PaymentInitiateRequest;
import com.taskbridge.paymentservice.dto.PaymentInitiateResponse;
import com.taskbridge.paymentservice.model.EscrowTransaction;
import com.taskbridge.paymentservice.repository.EscrowRepository;
import com.taskbridge.paymentservice.service.EscrowService;
import com.taskbridge.paymentservice.service.PayHereService;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {

    private final EscrowRepository escrowRepository;
    private final EscrowService escrowService;
    private final PayHereService payHereService;

    public PaymentController(EscrowRepository escrowRepository,
                              EscrowService escrowService,
                              PayHereService payHereService) {
        this.escrowRepository = escrowRepository;
        this.escrowService = escrowService;
        this.payHereService = payHereService;
    }

    @PostMapping("/initiate")
    public ResponseEntity<PaymentInitiateResponse> initiate(@RequestBody PaymentInitiateRequest request) {
        EscrowTransaction escrow = escrowRepository.findByTaskId(request.getTaskId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "No pending escrow found for task " + request.getTaskId()));

        // TODO: fetch the real task title from task-service (via event-populated
        // local cache, or a lightweight lookup) instead of this placeholder.
        String taskTitle = "Task " + escrow.getTaskId();

        PaymentInitiateResponse response = payHereService.buildCheckoutParams(escrow, taskTitle);
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/webhook", consumes = "application/x-www-form-urlencoded")
    public ResponseEntity<String> webhook(@RequestParam Map<String, String> params) {
        boolean valid = payHereService.validateSignature(params);
        if (!valid) {
            return ResponseEntity.badRequest().body("Invalid signature");
        }

        String statusCode = params.get("status_code");
        String orderId = params.get("order_id"); // this is the taskId
        String paymentId = params.get("payment_id");

        if ("2".equals(statusCode)) {
            escrowService.markHeld(java.util.UUID.fromString(orderId), paymentId);
        }
        // status_code 0, -1, -2 → log only, no state change; -3 → flag for admin review.
        // Logging for those cases can live in EscrowService or a dedicated audit log —
        // deliberately not modeled here since it's not part of the state machine itself.

        // PayHere expects a 200 regardless of which status_code was received,
        // as long as the signature was valid — otherwise it will keep retrying.
        return ResponseEntity.ok("OK");
    }
}