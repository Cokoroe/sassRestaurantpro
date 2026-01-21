package com.sassfnb.application.service;

import com.sassfnb.adapters.rest.dto.payroll.PayrollDtos.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface PayrollService {

    // Pay rates
    PayRateResponse createRate(PayRateUpsertRequest req);

    PayRateResponse updateRate(UUID rateId, PayRateUpsertRequest req);

    List<PayRateResponse> listRates(UUID outletId, UUID staffId, LocalDate at);

    // Periods
    PayrollPeriodResponse createPeriod(PayrollPeriodCreateRequest req);

    List<PayrollPeriodResponse> listPeriods(UUID outletId);

    PayrollPeriodResponse closePeriod(UUID periodId);

    // Calculate
    PayrollPeriodDetailsResponse calculate(UUID periodId, boolean replaceExisting);

    PayrollPeriodDetailsResponse getPeriodDetails(UUID periodId);
}
