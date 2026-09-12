package com.taskbridge.paymentservice.event;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskbridge.paymentservice.service.EscrowService;
import org.springframework.stereotype.Component;

@Component
public class BidAcceptedEventConsumer {

    private final ObjectMapper objectMapper;
    private final EscrowService escrowService;

    public BidAcceptedEventConsumer(
            ObjectMapper objectMapper,
            EscrowService escrowService
    ) {
        this.objectMapper = objectMapper;
        this.escrowService = escrowService;
    }

    public void handleMessage(String message) {
        try {
            System.out.println("Received BID_ACCEPTED: " + message);

            BidAcceptedEvent event =
                    objectMapper.readValue(message, BidAcceptedEvent.class);

            escrowService.createPending(
                    event.taskId(),
                    event.posterId(),
                    event.freelancerId(),
                    event.amountLkr()
            );

            System.out.println(
                    "Created PENDING escrow for task: " + event.taskId()
            );

        } catch (Exception e) {
            System.err.println(
                    "Failed to process BID_ACCEPTED: " + e.getMessage()
            );
            e.printStackTrace();
        }
    }
}