package com.academy.entity.enums;

/**
 * How a MASTERCLASS is delivered. Only meaningful when
 * {@link CourseType#MASTERCLASS} is selected.
 *
 * RECORDED – behaves like a normal course: the student pays online and then
 *            watches the lessons in the curriculum.
 *
 * LIVE     – a bespoke ("sur mesure") live session. There is no curriculum;
 *            the student reserves a place by starting a WhatsApp conversation
 *            with the academy, and the details are agreed there.
 */
public enum MasterclassFormat {
    RECORDED,
    LIVE
}
