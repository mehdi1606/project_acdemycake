package com.academy.service.email;

import java.math.BigDecimal;

/**
 * What an unfinished payment was for, used by the reminder / cancellation emails.
 *
 * @param kind        human label: "subscription", "course", "masterclass", "ebook"
 * @param itemTitle   e.g. the course or ebook title, or the plan name
 * @param payAgainUrl page where the customer can start a new payment
 */
public record PendingPaymentInfo(String kind, String itemTitle, BigDecimal amount, String currency,
                                 String orderId, String payAgainUrl) {}
