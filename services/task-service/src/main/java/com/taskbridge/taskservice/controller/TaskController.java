package com.taskbridge.taskservice.controller;

import com.taskbridge.taskservice.config.SecurityConfig.TaskBridgePrincipal;
import com.taskbridge.taskservice.dto.TaskRequest;
import com.taskbridge.taskservice.dto.TaskResponse;
import com.taskbridge.taskservice.model.TaskCategory;
import com.taskbridge.taskservice.model.TaskStatus;
import com.taskbridge.taskservice.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    // ---- GET /api/v1/tasks ----
    @GetMapping
    public ResponseEntity<Page<TaskResponse>> listTasks(
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) TaskCategory category,
            @RequestParam(required = false) BigDecimal budgetMin,
            @RequestParam(required = false) BigDecimal budgetMax,
            @RequestParam(required = false) UUID posterId,
            @RequestParam(required = false) UUID assignedTo,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        Page<TaskResponse> result = taskService.listTasks(
                status, category, budgetMin, budgetMax, posterId, assignedTo, search, pageable
        );
        return ResponseEntity.ok(result);
    }

    // ---- GET /api/v1/tasks/{taskId} ----
    @GetMapping("/{taskId}")
    public ResponseEntity<TaskResponse> getTask(@PathVariable UUID taskId) {
        return ResponseEntity.ok(taskService.getTask(taskId));
    }

    // ---- POST /api/v1/tasks ----
    @PostMapping
    public ResponseEntity<TaskResponse> createTask(@RequestBody @Valid TaskRequest request) {
        TaskBridgePrincipal principal = getPrincipal();
        TaskResponse response = taskService.createTask(
                request,
                principal.getUserId(),
                principal.getFullName(),
                principal.getAvatarUrl()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ---- PUT /api/v1/tasks/{taskId} ----
    @PutMapping("/{taskId}")
    public ResponseEntity<TaskResponse> updateTask(
            @PathVariable UUID taskId,
            @RequestBody @Valid TaskRequest request
    ) {
        TaskBridgePrincipal principal = getPrincipal();
        return ResponseEntity.ok(taskService.updateTask(taskId, request, principal.getUserId()));
    }

    // ---- DELETE /api/v1/tasks/{taskId} ----
    @DeleteMapping("/{taskId}")
    public ResponseEntity<Void> deleteTask(@PathVariable UUID taskId) {
        TaskBridgePrincipal principal = getPrincipal();
        taskService.deleteTask(taskId, principal.getUserId());
        return ResponseEntity.noContent().build();
    }

    // ---- POST /api/v1/tasks/{taskId}/submit ----
    @PostMapping("/{taskId}/submit")
    public ResponseEntity<TaskResponse> submitWork(@PathVariable UUID taskId) {
        TaskBridgePrincipal principal = getPrincipal();
        return ResponseEntity.ok(taskService.submitWork(taskId, principal.getUserId()));
    }

    // ---- POST /api/v1/tasks/{taskId}/dispute ----
    @PostMapping("/{taskId}/dispute")
    public ResponseEntity<TaskResponse> raiseDispute(
            @PathVariable UUID taskId,
            @RequestBody Map<String, String> body
    ) {
        TaskBridgePrincipal principal = getPrincipal();
        String reason = body.get("reason");
        return ResponseEntity.ok(taskService.raiseDispute(taskId, principal.getUserId(), reason));
    }

    // ---- POST /api/v1/tasks/{taskId}/resolve (admin only) ----
    @PostMapping("/{taskId}/resolve")
    public ResponseEntity<TaskResponse> resolveDispute(
            @PathVariable UUID taskId,
            @RequestBody Map<String, String> body
    ) {
        String escrowAction = body.get("escrowAction"); // "RELEASE" or "REFUND"
        return ResponseEntity.ok(taskService.resolveDispute(taskId, escrowAction));
    }

    // ---- shared helper ----
    private TaskBridgePrincipal getPrincipal() {
        return (TaskBridgePrincipal) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();
    }
}
