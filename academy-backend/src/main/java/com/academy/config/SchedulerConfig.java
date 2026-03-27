package com.academy.config;

import com.academy.service.NotificationService;
import com.academy.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class SchedulerConfig {

    private final SubscriptionService subscriptionService;
    private final NotificationService notificationService;

    @Scheduled(cron = "0 0 0 * * *")
    public void checkExpiredSubscriptions() {
        log.info("Running subscription expiry check...");
        try {
            subscriptionService.checkAndExpireSubscriptions();
            log.info("Subscription expiry check completed");
        } catch (Exception e) {
            log.error("Error during subscription expiry check: {}", e.getMessage());
        }
    }

    @Scheduled(cron = "0 0 9 * * *")
    public void sendSubscriptionReminders() {
        log.info("Sending subscription expiry reminders...");
        try {
            subscriptionService.sendExpiryReminders();
            log.info("Subscription reminders sent");
        } catch (Exception e) {
            log.error("Error sending subscription reminders: {}", e.getMessage());
        }
    }

    @Scheduled(cron = "0 0 2 1 * *")
    public void cleanupOldNotifications() {
        log.info("Cleaning up old notifications...");
        try {
            notificationService.cleanupOldNotifications();
            log.info("Old notifications cleanup completed");
        } catch (Exception e) {
            log.error("Error during notifications cleanup: {}", e.getMessage());
        }
    }
}
