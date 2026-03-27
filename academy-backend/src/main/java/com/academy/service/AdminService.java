package com.academy.service;

import com.academy.dto.response.DashboardResponse;
import com.academy.dto.response.PageResponse;
import com.academy.entity.PaymentTransaction;

public interface AdminService {

    DashboardResponse.AdminDashboard getDashboard();

    PageResponse<PaymentTransaction> getTransactions(int page, int size);

    Object getAnalytics(String period);

    Object getReports(String type);
}
