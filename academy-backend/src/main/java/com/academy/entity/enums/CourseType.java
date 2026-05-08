package com.academy.entity.enums;

/**
 * Determines how students can access a course.
 *
 * PLAN        – included in the SARALÖWE subscription; active subscribers
 *               can access at no extra cost.
 *
 * MASTERCLASS – one-time purchase; even subscribers must buy individually.
 *               The price is set by the instructor and gated by
 *               requiresPurchase = true.
 */
public enum CourseType {
    PLAN,
    MASTERCLASS
}
