// PaymentInitiateResponse.java
package com.taskbridge.paymentservice.dto;

import java.math.BigDecimal;

public class PaymentInitiateResponse {
    private String merchantId;
    private String orderId;
    private String items;
    private BigDecimal amountLKR;
    private String currency;
    private String hash;
    private String returnUrl;
    private String cancelUrl;
    private String notifyUrl;

    // constructor + getters/setters

    public PaymentInitiateResponse() {}

    public PaymentInitiateResponse(String merchantId, String orderId, String items,
                                     BigDecimal amountLKR, String currency, String hash,
                                     String returnUrl, String cancelUrl, String notifyUrl) {
        this.merchantId = merchantId;
        this.orderId = orderId;
        this.items = items;
        this.amountLKR = amountLKR;
        this.currency = currency;
        this.hash = hash;
        this.returnUrl = returnUrl;
        this.cancelUrl = cancelUrl;
        this.notifyUrl = notifyUrl;
    }

    public String getMerchantId() { return merchantId; }
    public String getOrderId() { return orderId; }
    public String getItems() { return items; }
    public BigDecimal getAmountLKR() { return amountLKR; }
    public String getCurrency() { return currency; }
    public String getHash() { return hash; }
    public String getReturnUrl() { return returnUrl; }
    public String getCancelUrl() { return cancelUrl; }
    public String getNotifyUrl() { return notifyUrl; }
}