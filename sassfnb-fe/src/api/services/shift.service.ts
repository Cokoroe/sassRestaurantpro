// src/api/services/shift.service.ts
import { http } from "../client";
import { unwrap } from "./_unwrap";
import type {
  ShiftTemplate,
  ShiftTemplateCreateRequest,
  ShiftTemplateUpdateRequest,
  ShiftAssignment,
  ShiftScheduleRequest,
  ShiftUpdateRequest,
  ShiftStatusUpdateRequest,
  ShiftSearchParams,
  MyShiftSearchParams,
} from "../../types/shift";

export type MyShiftParams = {
  outletId: string;        // set header X-Outlet-Id
  dateFrom: string;        // yyyy-MM-dd
  dateTo: string;          // yyyy-MM-dd
  status?: string;         // ASSIGNED | ... (optional)
};

export const shiftService = {
  // ===== Templates =====
  listTemplates: async (params?: { outletId?: string | null }) => {
    const res = await http.get<ShiftTemplate[]>("/shifts/templates", { params });
    return unwrap<ShiftTemplate[]>(res);
  },

  createTemplate: async (payload: ShiftTemplateCreateRequest) => {
    const res = await http.post<ShiftTemplate>("/shifts/templates", payload);
    return unwrap<ShiftTemplate>(res);
  },

  updateTemplate: async (templateId: string, payload: ShiftTemplateUpdateRequest) => {
    const res = await http.patch<ShiftTemplate>(`/shifts/templates/${templateId}`, payload);
    return unwrap<ShiftTemplate>(res);
  },

  deleteTemplate: async (templateId: string) => {
    const anyHttp: any = http as any;
    const res =
      typeof anyHttp.del === "function"
        ? await anyHttp.del(`/shifts/templates/${templateId}`)
        : await http.del(`/shifts/templates/${templateId}`);
    return unwrap<void>(res);
  },

  // ===== Scheduling =====
  schedule: async (payload: ShiftScheduleRequest) => {
    const res = await http.post<ShiftAssignment[]>("/shifts/schedule", payload);
    return unwrap<ShiftAssignment[]>(res);
  },

  search: async (params: ShiftSearchParams) => {
    const res = await http.get<ShiftAssignment[]>("/shifts", { params });
    return unwrap<ShiftAssignment[]>(res);
  },

  updateAssignment: async (id: string, payload: ShiftUpdateRequest) => {
    const res = await http.patch<ShiftAssignment>(`/shifts/${id}`, payload);
    return unwrap<ShiftAssignment>(res);
  },

  updateAssignmentStatus: async (id: string, payload: ShiftStatusUpdateRequest) => {
    const res = await http.patch<void>(`/shifts/${id}/status`, payload);
    return unwrap<void>(res);
  },

  // ===== My shifts =====
  myShifts: async (params?: MyShiftSearchParams) => {
    const res = await http.get<ShiftAssignment[]>("/shifts/my", { params });
    return unwrap<ShiftAssignment[]>(res);
  },

  my: async (params: MyShiftParams) => {
    const { outletId, ...query } = params;

    const res = await http.get<ShiftAssignment[]>("/shifts/my", {
      params: query,
      headers: {
        "X-Outlet-Id": outletId,
      },
    });

    return unwrap<ShiftAssignment[]>(res);
  },
};
