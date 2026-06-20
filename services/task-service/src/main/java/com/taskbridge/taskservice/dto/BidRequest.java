package com.taskbridge.taskservice.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BidRequest {

    @NotNull
    @DecimalMin(value = "100", message = "amountLkr must be at least 100")
    private BigDecimal amountLkr;

    @NotBlank
    private String proposal;

    @NotNull
    @Min(value = 1, message = "deliveryDays must be at least 1")
    private int deliveryDays;

}