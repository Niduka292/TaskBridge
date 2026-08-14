package com.taskbridge.paymentservice.repository;

import com.taskbridge.paymentservice.model.EscrowTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface EscrowRepository extends JpaRepository<EscrowTransaction, UUID> {
    Optional<EscrowTransaction> findByTaskId(UUID taskId);
}