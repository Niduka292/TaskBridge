package com.taskbridge.paymentservice.service;

import java.math.BigDecimal;
import java.security.MessageDigest;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.taskbridge.paymentservice.dto.PaymentInitiateResponse;
import com.taskbridge.paymentservice.model.EscrowTransaction;

@Service
public class PayHereService {

    @Value("${payhere.merchant-id}")
    private String merchantId;

    @Value("${payhere.merchant-secret}")
    private String merchantSecret;

    @Value("${payhere.base-url}")
    private String payHereBaseUrl;

    @Value("${app.return-url}")
    private String returnUrl;

    @Value("${app.cancel-url-base}")
    private String cancelUrlBase;

    @Value("${app.notify-url}")
    private String notifyUrl;

    public PaymentInitiateResponse buildCheckoutParams(EscrowTransaction escrow, String taskTitle) {
        BigDecimal amount = escrow.getAmountLkr();
        String orderId = escrow.getTaskId().toString();

        String hash = computeHash(merchantId, orderId, amount.toPlainString(), "LKR");

        return new PaymentInitiateResponse(
                merchantId,
                orderId,
                "Escrow: " + taskTitle,
                amount,
                "LKR",
                hash,
                returnUrl,
                cancelUrlBase + "/" + escrow.getTaskId(),
                notifyUrl
        );
    }

    /**
     * Computes the PayHere checkout hash (used to initiate a payment):
     * MD5(merchant_id + order_id + amount + currency + MD5(merchant_secret).toUpperCase()).toUpperCase()
     */
    private String computeHash(String merchantId, String orderId, String amount, String currency) {
        String merchantSecretHash = md5(merchantSecret).toUpperCase();
        String raw = merchantId + orderId + amount + currency + merchantSecretHash;
        return md5(raw).toUpperCase();
    }

    /**
     * Validates the md5sig sent back on the webhook:
     * MD5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + MD5(merchant_secret).toUpperCase()).toUpperCase()
     *
     * Note: PayHere includes status_code in the webhook signature formula (unlike the
     * checkout-initiation hash above, which doesn't have a status yet). Check PayHere's
     * current docs for your integration — some integrations omit it. Confirm against
     * the sandbox response before relying on this.
     */
    public boolean validateSignature(Map<String, String> params) {

        String merchantSecretHash = md5(merchantSecret).toUpperCase();

        String raw =
                params.get("merchant_id")
                        + params.get("order_id")
                        + params.get("payhere_amount")
                        + params.get("payhere_currency")
                        + params.get("status_code")
                        + merchantSecretHash;

        String expected = md5(raw).toUpperCase();
        String received = params.get("md5sig");

        System.out.println("merchant_id: " + params.get("merchant_id"));
        System.out.println("order_id: " + params.get("order_id"));
        System.out.println("amount: " + params.get("payhere_amount"));
        System.out.println("currency: " + params.get("payhere_currency"));
        System.out.println("status: " + params.get("status_code"));
        System.out.println("Expected MD5: " + expected);
        System.out.println("Received MD5: " + received);

        return expected.equalsIgnoreCase(received);
    }

    private String md5(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(input.getBytes());
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException("MD5 hashing failed", e);
        }
    }
}