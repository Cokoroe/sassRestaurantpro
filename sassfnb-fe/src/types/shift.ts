// src/types/shift.ts

export type ShiftTemplate = {
  id: string;
  outletId: string;
  name: string;
  startTime: string; // "HH:mm:ss" or "HH:mm"
  endTime: string;
  breakMinutes: number;
  roleRequired?: string | null;
  isActive: boolean;
  status?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ShiftTemplateCreateRequest = {
  outletId?: string | null; // optional: fallback current outlet on BE
  name: string;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  breakMinutes?: number | null;
  roleRequired?: string | null;
  isActive?: boolean | null;
  status?: string | null;
};

export type ShiftTemplateUpdateRequest = {
  name?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  breakMinutes?: number | null;
  roleRequired?: string | null;
  isActive?: boolean | null;
  status?: string | null;
};

export type ShiftAssignment = {
  id: string;
  outletId: string;
  staffId: string;
  staffName?: string | null;
  workShiftId?: string | null;
  workShiftName?: string | null;
  workDate: string;  // "yyyy-MM-dd"
  startTime: string; // "HH:mm:ss" or "HH:mm"
  endTime: string;
  breakMinutes: number;
  note?: string | null;
  status: string; // ASSIGNED/CANCELED/CLOSED/DONE...
  createdAt?: string;
  updatedAt?: string;
};

export type ShiftScheduleItem = {
  staffId: string;
  workDate: string; // "yyyy-MM-dd"
  workShiftId?: string | null;
  startTime?: string | null; // optional if workShiftId exists
  endTime?: string | null;
  breakMinutes?: number | null;
  note?: string | null;
  status?: string | null; // default ASSIGNED
};

export type ShiftScheduleRequest = {
  outletId?: string | null;
  items: ShiftScheduleItem[];
};

export type ShiftUpdateRequest = {
  staffId?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  breakMinutes?: number | null;
  note?: string | null;
  status?: string | null;
  workShiftId?: string | null;
};

export type ShiftStatusUpdateRequest = {
  status: string;
};

export type ShiftSearchParams = {
  outletId?: string | null;
  dateFrom: string; // yyyy-MM-dd
  dateTo: string;   // yyyy-MM-dd
  staffId?: string | null;
  status?: string | null;
};

export type MyShiftSearchParams = {
  dateFrom?: string | null;
  dateTo?: string | null;
  status?: string | null;
};
