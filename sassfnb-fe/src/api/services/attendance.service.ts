// src/api/services/attendance.service.ts
import { http } from "../client";
import { unwrap } from "./_unwrap";
import type { PageResponse } from "../../types/page";
import type {
  AttendanceAdjustmentResponse,
  AttendanceAdjustRequest,
  AttendanceApproveRequest,
  AttendanceClockInRequest,
  AttendanceClockOutRequest,
  AttendanceRecord,
  AttendanceSearchParams,
} from "../../types/attendance";

const withOutletHeader = (outletId?: string | null) =>
  outletId ? { "X-Outlet-Id": outletId } : undefined;

export const attendanceService = {
  clockIn: async (payload: AttendanceClockInRequest, outletId?: string | null) => {
    const res = await http.post<AttendanceRecord>("/attendance/clock-in", payload, {
      headers: withOutletHeader(outletId),
    });
    return unwrap<AttendanceRecord>(res);
  },

  clockOut: async (payload: AttendanceClockOutRequest, outletId?: string | null) => {
    const res = await http.post<AttendanceRecord>("/attendance/clock-out", payload, {
      headers: withOutletHeader(outletId),
    });
    return unwrap<AttendanceRecord>(res);
  },

  search: async (params: AttendanceSearchParams) => {
    const outletId = params.outletId;
    const res = await http.get<PageResponse<AttendanceRecord>>("/attendance", {
      params,
      headers: withOutletHeader(outletId),
    });
    return unwrap<PageResponse<AttendanceRecord>>(res);
  },

  /**
   * Helper cho "của tôi": có thể truyền staffId="self" hoặc bỏ staffId.
   * (BE support both. Để rõ ràng, mình set staffId="self".)
   */
  searchMy: async (params: Omit<AttendanceSearchParams, "staffId"> & { outletId: string }) => {
    const res = await http.get<PageResponse<AttendanceRecord>>("/attendance", {
      params: { ...params, staffId: "self" },
      headers: withOutletHeader(params.outletId),
    });
    return unwrap<PageResponse<AttendanceRecord>>(res);
  },

  requestAdjustment: async (
    attendanceId: string,
    payload: AttendanceAdjustRequest,
    outletId?: string | null
  ) => {
    const res = await http.post<AttendanceAdjustmentResponse>(
      `/attendance/${attendanceId}/adjust`,
      payload,
      { headers: withOutletHeader(outletId) }
    );
    return unwrap<AttendanceAdjustmentResponse>(res);
  },

  approveAdjustment: async (
    attendanceId: string,
    payload: AttendanceApproveRequest,
    outletId?: string | null
  ) => {
    const res = await http.post<AttendanceAdjustmentResponse>(
      `/attendance/${attendanceId}/approve`,
      payload,
      { headers: withOutletHeader(outletId) }
    );
    return unwrap<AttendanceAdjustmentResponse>(res);
  },
};
