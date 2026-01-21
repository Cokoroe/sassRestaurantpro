// src/types/attendance.ts
import type { UUID } from "./staff";

/**
 * Đồng bộ theo BE AttendanceStatus.
 * BE hiện dùng: PRESENT, LATE, ABSENT, ADJUSTMENT_PENDING, ADJUSTED, REJECTED
 */
export type AttendanceStatus =
  | "PRESENT"
  | "LATE"
  | "ABSENT"
  | "ADJUSTMENT_PENDING"
  | "ADJUSTED"
  | "REJECTED";

export type AttendanceClockInRequest = {
  shiftAssignmentId: UUID;
};

export type AttendanceClockOutRequest = {
  shiftAssignmentId: UUID;
};

export type AttendanceSearchParams = {
  outletId?: UUID;

  dateFrom?: string; // yyyy-MM-dd
  dateTo?: string; // yyyy-MM-dd

  /**
   * BE hỗ trợ:
   * - staffId = "self" => resolve từ token
   * - staffId = UUID => filter staff cụ thể
   * - staffId null => report all
   */
  staffId?: string; // UUID string hoặc "self"

  status?: AttendanceStatus;

  page?: number;
  size?: number;
};

export type AttendanceRecord = {
  id: UUID;

  tenantId: UUID;
  restaurantId: UUID;
  outletId: UUID;

  staffId: UUID;
  staffName?: string | null;

  shiftAssignmentId: UUID;

  workDate: string; // yyyy-MM-dd

  clockInTime?: string | null; // ISO OffsetDateTime
  clockOutTime?: string | null; // ISO OffsetDateTime
  totalWorkMinutes?: number | null;

  status: AttendanceStatus;
  hasPendingAdjust: boolean;

  // pending adjustment info (if exists)
  requestedClockInTime?: string | null;
  requestedClockOutTime?: string | null;
  requestedStatus?: AttendanceStatus | null;
  requestedReason?: string | null;
};

export type AttendanceAdjustRequest = {
  requestedClockInTime?: string | null; // ISO OffsetDateTime
  requestedClockOutTime?: string | null; // ISO OffsetDateTime
  requestedStatus?: AttendanceStatus | null;
  reason?: string | null;
};

export type AttendanceApproveRequest = {
  approve: boolean;
  note?: string | null;
};

export type AttendanceAdjustmentResponse = {
  adjustmentId: UUID;
  attendanceId: UUID;

  requestedByUserId: UUID;
  requestedAt: string;

  originalClockInTime?: string | null;
  originalClockOutTime?: string | null;
  originalStatus?: AttendanceStatus | null;

  requestedClockInTime?: string | null;
  requestedClockOutTime?: string | null;
  requestedStatus?: AttendanceStatus | null;

  reason?: string | null;

  approveStatus: "PENDING" | "APPROVED" | "REJECTED";
  approvedByUserId?: UUID | null;
  approvedAt?: string | null;
  approveNote?: string | null;
};
