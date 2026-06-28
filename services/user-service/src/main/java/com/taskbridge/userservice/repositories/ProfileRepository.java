package com.taskbridge.userservice.repositories;

import java.math.BigDecimal;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import com.taskbridge.userservice.model.Profile;

import jakarta.transaction.Transactional;
import org.springframework.data.repository.query.Param;

public interface ProfileRepository extends JpaRepository<Profile, UUID> {
    @Modifying
    @Transactional
    @Query("""
            UPDATE Profile p
            SET p.balance = p.balance + :amount
            WHERE p.id = :id
            """)
    void incrementBalance(UUID id, BigDecimal amount);

    @Modifying
    @Transactional
    @Query("UPDATE Profile p SET p.completedTaskCount = p.completedTaskCount + 1 WHERE p.id = :id")
    void incrementCompletedCount(@Param("id") UUID id);
}
