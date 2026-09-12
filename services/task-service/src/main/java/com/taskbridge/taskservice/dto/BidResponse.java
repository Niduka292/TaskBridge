package com.taskbridge.taskservice.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import com.taskbridge.taskservice.model.Bid;
import com.taskbridge.taskservice.model.BidStatus;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class BidResponse {

    private UUID id;
    private UUID taskId;
    private UUID bidderId;
    private String bidderName;
    private String bidderAvatar;
    private BigDecimal amountLkr;
    private String proposal;
    private int deliveryDays;
    private BidStatus status;
    private Instant createdAt;

    /**
     * Full view - used when the caller is the task poster.
     */
    public static BidResponse fromEntity(Bid bid) {
        BidResponse dto = baseFromEntity(bid);
        dto.bidderName = bid.getBidderName();
        dto.bidderAvatar = bid.getBidderAvatar();
        return dto;
    }

    /**
     * Redacted view - used when caller is NOT the task poster.
     */
    public static BidResponse fromEntityRedacted(Bid bid) {
        return baseFromEntity(bid);
    }

    private static BidResponse baseFromEntity(Bid bid) {
        BidResponse dto = new BidResponse();
        dto.id = bid.getId();
        dto.taskId = bid.getTask().getId();
        dto.bidderId = bid.getBidderId();
        dto.amountLkr = bid.getAmountLkr();
        dto.proposal = bid.getProposal();
        dto.deliveryDays = bid.getDeliveryDays();
        dto.status = bid.getStatus();
        dto.createdAt = bid.getCreatedAt();
        return dto;
    }
}
