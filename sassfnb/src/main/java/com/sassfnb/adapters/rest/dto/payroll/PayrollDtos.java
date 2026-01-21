package com.sassfnb.adapters.rest.dto.payroll;

import com.sassfnb.application.domain.payroll.PayrollPeriodStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class PayrollDtos {

        public record PayRateUpsertRequest(
                        UUID staffId,
                        UUID outletId,
                        BigDecimal hourlyRate,
                        LocalDate effectiveFrom,
                        LocalDate effectiveTo) {
        }

        // ✅ NEW: staffName, staffCode để FE hiển thị thân thiện
        public record PayRateResponse(
                        UUID id,
                        UUID tenantId,
                        UUID staffId,
                        String staffName,
                        String staffCode,
                        UUID outletId,
                        BigDecimal hourlyRate,
                        LocalDate effectiveFrom,
                        LocalDate effectiveTo,
                        Instant createdAt,
                        Instant updatedAt) {
        }

        public record PayrollPeriodCreateRequest(
                        UUID outletId,
                        LocalDate startDate,
                        LocalDate endDate) {
        }

        public record PayrollPeriodResponse(
                        UUID id,
                        UUID tenantId,
                        UUID outletId,
                        LocalDate startDate,
                        LocalDate endDate,
                        PayrollPeriodStatus status,
                        Instant createdAt,
                        Instant closedAt) {
        }

        // ✅ NEW: staffName, staffCode để bảng lương hiển thị dễ hiểu
        public record PayrollDetailResponse(
                        UUID id,
                        UUID payrollPeriodId,
                        UUID outletId,
                        UUID staffId,
                        String staffName,
                        String staffCode,
                        BigDecimal totalHours,
                        BigDecimal grossPay,
                        BigDecimal tipsAmount,
                        BigDecimal netPay,
                        Instant createdAt,
                        Instant updatedAt) {
        }

        public record PayrollPeriodDetailsResponse(
                        PayrollPeriodResponse period,
                        List<PayrollDetailResponse> details) {
        }
}
