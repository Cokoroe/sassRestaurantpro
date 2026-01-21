// src/api/services/report.service.ts
import { http } from "../client";
import type {
  ReportBaseQuery,
  SummaryResponse,
  TopItemsResponse,
  TopCategoriesResponse,
  PeakHoursResponse,
  TableTurnoverResponse,
  StaffPerformanceResponse,
  PayrollSummaryResponse,
} from "../../types/report";

export const reportService = {
  summary: (params: ReportBaseQuery) =>
    http.get<SummaryResponse>("/reports/summary", { params }),

  topItems: (params: ReportBaseQuery & { limit?: number }) =>
    http.get<TopItemsResponse>("/reports/top-items", { params }),

  topCategories: (params: ReportBaseQuery & { limit?: number }) =>
    http.get<TopCategoriesResponse>("/reports/top-categories", { params }),

  peakHours: (params: ReportBaseQuery) =>
    http.get<PeakHoursResponse>("/reports/peak-hours", { params }),

  tableTurnover: (params: ReportBaseQuery) =>
    http.get<TableTurnoverResponse>("/reports/table-turnover", { params }),

  staffPerformance: (params: ReportBaseQuery) =>
    http.get<StaffPerformanceResponse>("/reports/staff-performance", { params }),

  payrollSummary: (params: ReportBaseQuery) =>
    http.get<PayrollSummaryResponse>("/reports/payroll-summary", { params }),
};
