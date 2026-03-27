package com.academy.service;

import com.academy.dto.request.RequestPayoutRequest;
import com.academy.dto.response.DashboardResponse;
import com.academy.dto.response.EarningResponse;
import com.academy.dto.response.EarningsSummaryResponse;
import com.academy.dto.response.PageResponse;
import com.academy.dto.response.PayoutResponse;
import com.academy.entity.enums.EarningSourceType;

import java.math.BigDecimal;
import java.util.UUID;

public interface InstructorService {

    DashboardResponse.InstructorDashboard getDashboard();

    BigDecimal getTotalEarnings();

    BigDecimal getPendingEarnings();

    BigDecimal getMonthlyEarnings();

    /** Summary card data + last-12-months chart breakdown */
    EarningsSummaryResponse getEarningsSummary();

    PageResponse<EarningResponse> getEarnings(int page, int size);

    PageResponse<PayoutResponse> getPayouts(int page, int size);

    PayoutResponse requestPayout(RequestPayoutRequest request);

    void createEarning(UUID instructorId, UUID courseId, UUID sourceId,
                       EarningSourceType sourceType, BigDecimal amount);
}
