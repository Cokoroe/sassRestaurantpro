// src/api/services/payroll.service.ts
import { http } from "../client";
import { unwrap } from "./_unwrap";
import type {
  PayRateResponse,
  PayRateUpsertRequest,
  PayrollPeriodCreateRequest,
  PayrollPeriodDetailsResponse,
  PayrollPeriodResponse,
} from "../../types/payroll";

export const payrollService = {
  // ===== Pay rates =====
  listRates: async (params: { outletId: string; staffId?: string; at?: string }) => {
    const res = await http.get<PayRateResponse[]>("/payroll/pay-rates", { params });
    return unwrap<PayRateResponse[]>(res);
  },

  createRate: async (payload: PayRateUpsertRequest) => {
    const res = await http.post<PayRateResponse>("/payroll/pay-rates", payload);
    return unwrap<PayRateResponse>(res);
  },

  updateRate: async (id: string, payload: PayRateUpsertRequest) => {
    const res = await http.put<PayRateResponse>(`/payroll/pay-rates/${id}`, payload);
    return unwrap<PayRateResponse>(res);
  },

  // ===== Periods =====
  createPeriod: async (payload: PayrollPeriodCreateRequest) => {
    const res = await http.post<PayrollPeriodResponse>("/payroll/periods", payload);
    return unwrap<PayrollPeriodResponse>(res);
  },

  listPeriods: async (outletId: string) => {
    const res = await http.get<PayrollPeriodResponse[]>("/payroll/periods", {
      params: { outletId },
    });
    return unwrap<PayrollPeriodResponse[]>(res);
  },

  closePeriod: async (periodId: string) => {
    const res = await http.post<PayrollPeriodResponse>(`/payroll/periods/${periodId}/close`);
    return unwrap<PayrollPeriodResponse>(res);
  },

  // ===== Calculate / Details =====
  calculate: async (periodId: string, replaceExisting: boolean) => {
    const res = await http.post<PayrollPeriodDetailsResponse>(
      `/payroll/periods/${periodId}/calculate`,
      undefined,
      { params: { replaceExisting } }
    );
    return unwrap<PayrollPeriodDetailsResponse>(res);
  },

  getDetails: async (periodId: string) => {
    const res = await http.get<PayrollPeriodDetailsResponse>(`/payroll/periods/${periodId}/details`);
    return unwrap<PayrollPeriodDetailsResponse>(res);
  },
};
