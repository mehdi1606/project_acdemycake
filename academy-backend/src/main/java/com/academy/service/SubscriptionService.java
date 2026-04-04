package com.academy.service;

import com.academy.dto.response.PageResponse;
import com.academy.dto.response.PaymentResponse;
import com.academy.dto.response.SubscriptionPlanResponse;
import com.academy.dto.response.SubscriptionResponse;

import java.util.List;

public interface SubscriptionService {

    List<SubscriptionPlanResponse> getSubscriptionPlans();

    PaymentResponse subscribe();

    SubscriptionResponse getMySubscription();

    void cancelSubscription();

    SubscriptionResponse reactivateSubscription();

    PageResponse<SubscriptionResponse> getAllSubscriptions(int page, int size, String status);

    PageResponse<SubscriptionResponse> getSubscriptionHistory(int page, int size);

    void processSuccessfulPayment(String transactionId, String payzoneTransactionId);

    void processFailedPayment(String transactionId, String reason);

    void checkAndExpireSubscriptions();

    void sendExpiryReminders();
}
