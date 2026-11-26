package com.academy.service.invoice;

import java.util.UUID;

/** Published when a masterclass participant paid outside the platform is added with an amount. */
public record ManualBookingAddedEvent(UUID bookingId) {}
