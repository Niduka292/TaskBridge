package com.taskbridge.taskservice.repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.taskbridge.taskservice.model.Task;
import com.taskbridge.taskservice.model.TaskStatus;

public interface TaskRepository extends JpaRepository<Task, UUID>, JpaSpecificationExecutor<Task> {

    List<Task> findByStatusAndDeadlineBefore(TaskStatus status, Instant deadline);
}
