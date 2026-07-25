package com.taskbridge.taskservice.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.taskbridge.taskservice.config.SecurityConfig.TaskBridgePrincipal;
import com.taskbridge.taskservice.dto.BidRequest;
import com.taskbridge.taskservice.dto.BidResponse;
import com.taskbridge.taskservice.service.BidService;

import jakarta.validation.Valid;

@RestController
public class BidController {

    private final BidService bidService;

    public BidController(BidService bidService) {
        this.bidService = bidService;
    }

    // ---- GET /api/v1/tasks/{taskId}/bids ----
    @GetMapping("/api/v1/tasks/{taskId}/bids")
    public ResponseEntity<List<BidResponse>> listBids(@PathVariable UUID taskId) {
        TaskBridgePrincipal principal = getPrincipal();
        return ResponseEntity.ok(bidService.listBids(taskId, principal.getUserId()));
    }

    // ---- POST /api/v1/tasks/{taskId}/bids ----
    @PostMapping("/api/v1/tasks/{taskId}/bids")
    public ResponseEntity<BidResponse> submitBid(
            @PathVariable UUID taskId,
            @RequestBody @Valid BidRequest request
    ) {
        TaskBridgePrincipal principal = getPrincipal();
        BidResponse response = bidService.submitBid(
                taskId,
                request,
                principal.getUserId(),
                principal.getFullName(),
                principal.getAvatarUrl()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ---- PUT /api/v1/bids/{bidId}/accept ----
    @PutMapping("/api/v1/bids/{bidId}/accept")
    public ResponseEntity<BidResponse> acceptBid(@PathVariable UUID bidId) {
        TaskBridgePrincipal principal = getPrincipal();
        return ResponseEntity.ok(bidService.acceptBid(bidId, principal.getUserId()));
    }

    // ---- DELETE /api/v1/bids/{bidId} ----
    @DeleteMapping("/api/v1/bids/{bidId}")
    public ResponseEntity<Void> retractBid(@PathVariable UUID bidId) {
        TaskBridgePrincipal principal = getPrincipal();
        bidService.retractBid(bidId, principal.getUserId());
        return ResponseEntity.noContent().build();
    }

    // ---- shared helper ----
    private TaskBridgePrincipal getPrincipal() {
        return (TaskBridgePrincipal) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();
    }
}
