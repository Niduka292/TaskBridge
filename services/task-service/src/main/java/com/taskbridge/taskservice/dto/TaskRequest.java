package com.taskbridge.taskservice.dto;

import jakarta.validation.constraints.*;
import com.taskbridge.taskservice.model.TaskCategory;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TaskRequest {

    @NotBlank
    private String title;

    @NotBlank
    private String description;

    @NotNull
    @DecimalMin(value = "100", message = "budgetLkr must be at least 100")
    private BigDecimal budgetLkr;

    @NotNull
    @Future(message = "deadline must be in the future")
    private Instant deadline;

    @NotNull
    private TaskCategory category;

    private List<String> skillTags;

}