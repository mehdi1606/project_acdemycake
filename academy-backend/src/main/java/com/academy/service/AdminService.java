package com.academy.service;

import com.academy.dto.response.DashboardResponse;
import com.academy.dto.response.PageResponse;
import com.academy.dto.response.TransactionResponse;
import com.academy.dto.response.TransactionStatsResponse;
import com.academy.entity.enums.PaymentStatus;

import java.util.Map;

public interface AdminService {

    DashboardResponse.AdminDashboard getDashboard();

    /** @param status optional status filter; @param type optional transaction type filter */
    PageResponse<TransactionResponse> getTransactions(int page, int size, PaymentStatus status, String type);

    TransactionStatsResponse getTransactionStats();

    /** Whole-dataset course counts per status (admin Courses page stat cards). */
    Map<String, Long> getCourseStats();

    Object getAnalytics(String period);

    Object getReports(String type);

    /** One-time proactive translation of all existing courses & categories. */
    Object prewarmAllTranslations();
}
