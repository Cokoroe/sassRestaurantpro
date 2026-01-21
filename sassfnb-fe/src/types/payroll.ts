// src/types/payroll.ts
export type PayrollPeriodStatus = "OPEN" | "CLOSED";

export type PayRateUpsertRequest = {
  staffId: string;
  outletId: string;
  hourlyRate: number; // backend BigDecimal
  effectiveFrom: string; // yyyy-MM-dd
  effectiveTo?: string | null; // yyyy-MM-dd | null
};

export type PayRateResponse = {
  id: string;
  tenantId: string;

  staffId: string;
  staffName?: string | null;     // NEW
  staffCode?: string | null;     // NEW (tuỳ BE)
  staffEmail?: string | null;    // NEW (tuỳ BE)

  outletId: string;
  hourlyRate: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type PayrollPeriodCreateRequest = {
  outletId: string;
  startDate: string; // yyyy-MM-dd
  endDate: string; // yyyy-MM-dd
};

export type PayrollPeriodResponse = {
  id: string;
  tenantId: string;
  outletId: string;
  startDate: string;
  endDate: string;
  status: PayrollPeriodStatus;
  createdAt?: string | null; // Instant
  closedAt?: string | null; // Instant
};

export type PayrollDetailResponse = {
  id: string;
  payrollPeriodId: string;

  staffId: string;
  staffName?: string | null;     // NEW (nếu BE cũng trả trong details)
  staffCode?: string | null;     // NEW

  totalHours: number;
  grossPay: number;
  tipsAmount: number;
  netPay: number;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type PayrollPeriodDetailsResponse = {
  period: PayrollPeriodResponse;
  details: PayrollDetailResponse[];
};
