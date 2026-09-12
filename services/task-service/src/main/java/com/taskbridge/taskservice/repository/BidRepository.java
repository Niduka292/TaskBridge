package com.taskbridge.taskservice.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.taskbridge.taskservice.model.Bid;
import com.taskbridge.taskservice.model.BidStatus;

public interface BidRepository extends JpaRepository<Bid, UUID> {

    List<Bid> findByTaskId(UUID taskId);

    boolean existsByBidderIdAndTaskId(UUID bidderId, UUID taskId);

    boolean existsByBidderIdAndTaskIdAndStatus(UUID bidderId, UUID taskId, BidStatus status);

    @Modifying
    @Query("UPDATE Bid b SET b.status = :status WHERE b.task.id = :taskId AND b.id != :excludedBidId")
    void bulkUpdateStatusExcept(@Param("taskId") UUID taskId,
                                @Param("excludedBidId") UUID excludedBidId,
                                @Param("status") BidStatus status);
}