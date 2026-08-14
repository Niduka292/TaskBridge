package com.taskbridge.taskservice.service;

import java.math.BigDecimal;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.taskbridge.taskservice.dto.TaskRequest;
import com.taskbridge.taskservice.dto.TaskResponse;
import com.taskbridge.taskservice.model.Task;
import com.taskbridge.taskservice.model.TaskCategory;
import com.taskbridge.taskservice.model.TaskStatus;
import com.taskbridge.taskservice.repository.TaskRepository;
import com.taskbridge.taskservice.specification.TaskSpecification;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final TaskStateMachine taskStateMachine;

    public TaskService(TaskRepository taskRepository, TaskStateMachine taskStateMachine) {
        this.taskRepository = taskRepository;
        this.taskStateMachine = taskStateMachine;
    }

    // ---- LIST (with dynamic filters) ----
    public Page<TaskResponse> listTasks(
            TaskStatus status,
            TaskCategory category,
            BigDecimal budgetMin,
            BigDecimal budgetMax,
            UUID posterId,
            UUID assignedTo,
            String search,
            Pageable pageable
    ) {
        var spec = TaskSpecification.withFilters(
                status, category, budgetMin, budgetMax, posterId, assignedTo, search
        );
        return taskRepository.findAll(spec, pageable)
                .map(TaskResponse::fromEntity);
    }

    // ---- GET ONE ----
    public TaskResponse getTask(UUID taskId) {
        Task task = findTaskOrThrow(taskId);
        return TaskResponse.fromEntity(task);
    }

    // ---- CREATE ----
    @Transactional
    public TaskResponse createTask(TaskRequest request, UUID posterId, String posterName, String posterAvatar) {
        Task task = new Task();
        task.setPosterId(posterId);
        task.setPosterName(posterName);
        task.setPosterAvatar(posterAvatar);
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setBudgetLkr(request.getBudgetLkr());
        task.setDeadline(request.getDeadline());
        task.setCategory(request.getCategory());
        task.setSkillTags(request.getSkillTags() != null
                ? request.getSkillTags().toArray(new String[0])
                : new String[0]);
        task.setStatus(TaskStatus.OPEN); // always starts OPEN

        Task saved = taskRepository.save(task);
        return TaskResponse.fromEntity(saved);
    }

    // ---- UPDATE ----
    @Transactional
    public TaskResponse updateTask(UUID taskId, TaskRequest request, UUID callerId) {
        Task task = findTaskOrThrow(taskId);

        if (!task.getPosterId().equals(callerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the task poster can update this task");
        }

        if (task.getStatus() != TaskStatus.OPEN) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Task can only be updated while OPEN");
        }

        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setBudgetLkr(request.getBudgetLkr());
        task.setDeadline(request.getDeadline());
        task.setCategory(request.getCategory());
        task.setSkillTags(request.getSkillTags() != null
                ? request.getSkillTags().toArray(new String[0])
                : new String[0]);

        return TaskResponse.fromEntity(task); // dirty checking saves automatically inside @Transactional
    }

    // ---- DELETE ----
    @Transactional
    public void deleteTask(UUID taskId, UUID callerId) {
        Task task = findTaskOrThrow(taskId);

        if (!task.getPosterId().equals(callerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the task poster can delete this task");
        }

        if (task.getStatus() != TaskStatus.OPEN || task.getBidCount() > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Task can only be deleted while OPEN and with zero bids"
            );
        }

        taskRepository.delete(task);
    }

    // ---- SUBMIT WORK ----
    @Transactional
    public TaskResponse submitWork(UUID taskId, UUID callerId) {
        Task task = findTaskOrThrow(taskId);

        if (task.getAssignedTo() == null || !task.getAssignedTo().equals(callerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the assigned freelancer can submit work");
        }

        taskStateMachine.validateTransition(task.getStatus(), TaskStatus.PENDING_REVIEW);
        task.setStatus(TaskStatus.PENDING_REVIEW);

        return TaskResponse.fromEntity(task);
        // EventPublisher.publish(WORK_SUBMITTED) happens in the calling layer — see note below
    }

    // ---- RAISE DISPUTE ----
    @Transactional
    public TaskResponse raiseDispute(UUID taskId, UUID callerId, String reason) {
        Task task = findTaskOrThrow(taskId);

        boolean isParticipant = task.getPosterId().equals(callerId)
                || (task.getAssignedTo() != null && task.getAssignedTo().equals(callerId));
        if (!isParticipant) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only task participants can raise a dispute");
        }

        taskStateMachine.validateTransition(task.getStatus(), TaskStatus.DISPUTED);
        task.setStatus(TaskStatus.DISPUTED);
        task.setDisputeReason(reason);

        return TaskResponse.fromEntity(task);
    }

    // ---- RESOLVE DISPUTE (admin only — role check happens in controller/security layer) ----
    @Transactional
    public TaskResponse resolveDispute(UUID taskId, String escrowAction) {
        Task task = findTaskOrThrow(taskId);

        taskStateMachine.validateTransition(task.getStatus(), TaskStatus.COMPLETED);
        task.setStatus(TaskStatus.COMPLETED);

        return TaskResponse.fromEntity(task);
        // eventPublisher.publish("DISPUTE_RESOLVED", new DisputeResolvedEvent(taskId, escrowAction)) — wired later
    }

    // ---- shared lookup helper ----
    private Task findTaskOrThrow(UUID taskId) {
        return taskRepository.findById(taskId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found: " + taskId));
    }
}
