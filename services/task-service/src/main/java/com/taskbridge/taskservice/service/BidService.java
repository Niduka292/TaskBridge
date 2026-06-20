package com.taskbridge.taskservice.service;

import com.taskbridge.taskservice.dto.BidRequest;
import com.taskbridge.taskservice.dto.BidResponse;
import com.taskbridge.taskservice.model.Bid;
import com.taskbridge.taskservice.model.BidStatus;
import com.taskbridge.taskservice.model.Task;
import com.taskbridge.taskservice.model.TaskStatus;
import com.taskbridge.taskservice.repository.BidRepository;
import com.taskbridge.taskservice.repository.TaskRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class BidService {

    private final BidRepository bidRepository;
    private final TaskRepository taskRepository;

    public BidService(BidRepository bidRepository, TaskRepository taskRepository) {
        this.bidRepository = bidRepository;
        this.taskRepository = taskRepository;
    }

    // ---- LIST BIDS ON A TASK ----
    public List<BidResponse> listBids(UUID taskId, UUID callerId) {
        Task task = findTaskOrThrow(taskId);
        boolean callerIsPoster = task.getPosterId().equals(callerId);

        List<Bid> bids = bidRepository.findByTaskId(taskId);

        return bids.stream()
                .map(bid -> callerIsPoster
                        ? BidResponse.fromEntity(bid)
                        : BidResponse.fromEntityRedacted(bid))
                .toList();
    }

    // ---- SUBMIT A BID ----
    @Transactional
    public BidResponse submitBid(UUID taskId, BidRequest request, UUID bidderId, String bidderName, String bidderAvatar) {
        Task task = findTaskOrThrow(taskId);

        if (task.getPosterId().equals(bidderId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot bid on your own task");
        }

        if (task.getStatus() != TaskStatus.OPEN) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Task is not open for bidding");
        }

        boolean alreadyHasPendingBid = bidRepository.existsByBidderIdAndTaskIdAndStatus(
                bidderId, taskId, BidStatus.PENDING
        );
        if (alreadyHasPendingBid) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already have a pending bid on this task");
        }

        Bid bid = new Bid();
        bid.setTask(task);
        bid.setBidderId(bidderId);
        bid.setBidderName(bidderName);
        bid.setBidderAvatar(bidderAvatar);
        bid.setAmountLkr(request.getAmountLkr());
        bid.setProposal(request.getProposal());
        bid.setDeliveryDays(request.getDeliveryDays());
        bid.setStatus(BidStatus.PENDING);

        Bid saved = bidRepository.save(bid);

        task.setBidCount(task.getBidCount() + 1);
        // dirty checking saves the updated bidCount automatically

        return BidResponse.fromEntity(saved);
        // EventPublisher.publish(BID_RECEIVED) wired in later
    }

    // ---- ACCEPT A BID (atomic) ----
    @Transactional
    public BidResponse acceptBid(UUID bidId, UUID callerId) {
        Bid bid = bidRepository.findById(bidId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bid not found: " + bidId));

        Task task = bid.getTask();

        if (!task.getPosterId().equals(callerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the task poster can accept bids");
        }

        if (task.getStatus() != TaskStatus.OPEN) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Task is not open — cannot accept a bid");
        }

        if (bid.getStatus() != BidStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bid is not pending — cannot accept");
        }

        // Step 1: accept the winning bid
        bid.setStatus(BidStatus.ACCEPTED);

        // Step 2: bulk-reject all other bids on this task
        bidRepository.bulkUpdateStatusExcept(task.getId(), bid.getId(), BidStatus.REJECTED);

        // Step 3: assign the task
        task.setAssignedTo(bid.getBidderId());

        // NOTE: task status stays OPEN here — it only moves to IN_PROGRESS
        // when payment-service publishes ESCROW_HELD back (handled in EventConsumer)

        return BidResponse.fromEntity(bid);
        // EventPublisher.publish(BID_ACCEPTED) wired in later, AFTER commit
    }

    // ---- RETRACT A BID ----
    @Transactional
    public void retractBid(UUID bidId, UUID callerId) {
        Bid bid = bidRepository.findById(bidId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bid not found: " + bidId));

        if (!bid.getBidderId().equals(callerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only retract your own bid");
        }

        if (bid.getStatus() != BidStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending bids can be retracted");
        }

        bidRepository.delete(bid);

        Task task = bid.getTask();
        task.setBidCount(Math.max(0, task.getBidCount() - 1));
    }

    private Task findTaskOrThrow(UUID taskId) {
        return taskRepository.findById(taskId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found: " + taskId));
    }
}
