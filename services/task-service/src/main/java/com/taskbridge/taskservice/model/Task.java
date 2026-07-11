package com.taskbridge.taskservice.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(
    name = "tasks",
    indexes = {
        @Index(name = "idx_tasks_status",    columnList = "status"),
        @Index(name = "idx_tasks_poster_id", columnList = "poster_id"),
        @Index(name = "idx_tasks_deadline",  columnList = "deadline"),
        @Index(name = "idx_tasks_category",  columnList = "category")
    }
)
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "poster_id", nullable = false)
    private UUID posterId;

    @Column(name = "assigned_to")
    private UUID assignedTo;

    @Column(name = "poster_name")
    private String posterName;

    @Column(name = "poster_avatar")
    private String posterAvatar;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "budget_lkr", nullable = false, precision = 12, scale = 2)
    private BigDecimal budgetLkr;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskStatus status = TaskStatus.OPEN;

    @Column(nullable = false)
    private Instant deadline;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskCategory category;

    @Column(name = "skill_tags", columnDefinition = "text[]")
    private String[] skillTags = new String[0];

    @Column(name = "bid_count")
    private int bidCount = 0;

    @Column(name = "dispute_reason")
    private String disputeReason;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    
    // (generate with your IDE or use Lombok @Data if your project uses it)
}
