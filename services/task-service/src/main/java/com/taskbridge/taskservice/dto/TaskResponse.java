package com.taskbridge.taskservice.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.taskbridge.taskservice.model.Task;
import com.taskbridge.taskservice.model.TaskStatus;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class TaskResponse {

    private UUID id;
    private UUID posterId;
    private String posterName;
    private String posterAvatar;
    private UUID assignedTo;
    private String title;
    private String description;
    private BigDecimal budgetLkr;
    private TaskStatus status;
    private Instant deadline;
    private String category;
    private List<String> skillTags;
    private int bidCount;
    private String disputeReason;
    private Instant createdAt;
    private Instant updatedAt;

    public static TaskResponse fromEntity(Task task) {
        TaskResponse dto = new TaskResponse();
        dto.id = task.getId();
        dto.posterId = task.getPosterId();
        dto.posterName = task.getPosterName();
        dto.posterAvatar = task.getPosterAvatar();
        dto.assignedTo = task.getAssignedTo();
        dto.title = task.getTitle();
        dto.description = task.getDescription();
        dto.budgetLkr = task.getBudgetLkr();
        dto.status = task.getStatus();
        dto.deadline = task.getDeadline();
        dto.category = task.getCategory();
        dto.skillTags = task.getSkillTags() != null
                ? List.of(task.getSkillTags())
                : List.of();
        dto.bidCount = task.getBidCount();
        dto.disputeReason = task.getDisputeReason();
        dto.createdAt = task.getCreatedAt();
        dto.updatedAt = task.getUpdatedAt();
        return dto;
    }
}