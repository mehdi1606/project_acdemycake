package com.academy.service;

import com.academy.dto.response.DashboardResponse;
import com.academy.dto.response.PageResponse;
import com.academy.dto.response.TransactionResponse;
import com.academy.dto.response.TransactionStatsResponse;

public interface AdminService {

    DashboardResponse.AdminDashboard getDashboard();

    PageResponse<TransactionResponse> getTransactions(int page, int size);

    TransactionStatsResponse getTransactionStats();

    Object getAnalytics(String period);

    Object getReports(String type);
}
