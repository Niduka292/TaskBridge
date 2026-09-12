package com.taskbridge.taskservice.model;

import jakarta.persistence.*;

import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "bids")
public class Bid {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @Column(name = "bidder_id", nullable = false)
    private UUID bidderId;

    @Column(name = "bidder_name")
    private String bidderName;

    @Column(name = "bidder_avatar")
    private String bidderAvatar;

    @Column(name = "amount_lkr", nullable = false, precision = 12, scale = 2)
    private BigDecimal amountLkr;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String proposal;

    @Column(name = "delivery_days", nullable = false)
    private int deliveryDays;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BidStatus status = BidStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    // --- getters & setters ---
}
