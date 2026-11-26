package com.academy.service.invoice;

import java.util.UUID;

/** Published inside the settling transaction when a payment becomes COMPLETED. */
public record PaymentCompletedEvent(UUID paymentId) {}
