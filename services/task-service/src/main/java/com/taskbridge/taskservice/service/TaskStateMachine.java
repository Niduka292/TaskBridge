package com.taskbridge.taskservice.service;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import com.taskbridge.taskservice.model.TaskStatus;

@Component
public class TaskStateMachine {

    private static final Map<TaskStatus, Set<TaskStatus>> ALLOWED_TRANSITIONS = new EnumMap<>(TaskStatus.class);

    static {
        ALLOWED_TRANSITIONS.put(TaskStatus.OPEN, EnumSet.of(TaskStatus.IN_PROGRESS));
        ALLOWED_TRANSITIONS.put(TaskStatus.IN_PROGRESS, EnumSet.of(TaskStatus.PENDING_REVIEW, TaskStatus.DISPUTED));
        ALLOWED_TRANSITIONS.put(TaskStatus.PENDING_REVIEW, EnumSet.of(TaskStatus.COMPLETED, TaskStatus.DISPUTED));
        ALLOWED_TRANSITIONS.put(TaskStatus.DISPUTED, EnumSet.of(TaskStatus.COMPLETED));
        ALLOWED_TRANSITIONS.put(TaskStatus.COMPLETED, EnumSet.noneOf(TaskStatus.class)); // terminal state
    }

    /**
     * Validates that a transition from current -> target is legal.
     * Throws 409 Conflict if not.
     */
    public void validateTransition(TaskStatus current, TaskStatus target) {
        Set<TaskStatus> allowedNext = ALLOWED_TRANSITIONS.get(current);
        if (allowedNext == null || !allowedNext.contains(target)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Invalid task state transition: " + current + " -> " + target
            );
        }
    }
}
