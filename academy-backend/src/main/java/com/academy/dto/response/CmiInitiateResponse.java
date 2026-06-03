package com.academy.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.Map;
import java.util.UUID;

/**
 * Returned by POST /api/v1/payments/cmi/initiate/**
 *
 * The frontend must:
 *  1. Store transactionId in sessionStorage (for polling on the callback page)
 *  2. Build a hidden HTML <form method="POST" action={gatewayUrl}>
 *  3. Append every entry in formParams as a hidden <input>
 *  4. Auto-submit the form
 *
 * The formParams map already contains the computed HASH — the frontend
 * must NOT re-compute or modify it.
 */
@Data
@Builder
public class CmiInitiateResponse {

    /** Our internal PaymentTransaction UUID — store in sessionStorage */
    private UUID transactionId;

    /** The CMI gateway URL to POST the form to */
    private String gatewayUrl;

    /**
     * All CMI form fields, including the pre-computed HASH.
     * Already sorted for readability but order does not matter for the POST.
     */
    private Map<String, String> formParams;
}
