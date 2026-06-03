package com.academy.service;

import com.academy.dto.response.DashboardResponse;
import com.academy.dto.response.PageResponse;
import com.academy.dto.response.TransactionResponse;

public interface AdminService {

    DashboardResponse.AdminDashboard getDashboard();

    PageResponse<TransactionResponse> getTransactions(int page, int size);

    Object getAnalytics(String period);

    Object getReports(String type);
}
