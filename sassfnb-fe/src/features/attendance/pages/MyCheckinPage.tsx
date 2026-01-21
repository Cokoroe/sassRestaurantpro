// src/features/attendance/pages/MyCheckinPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { AppLayoutContext } from "../../../layout/AppLayout";
import { useAppContextStore } from "../../../store/useAppContextStore";
import { shiftService } from "../../../api/services/shift.service";
import { attendanceService } from "../../../api/services/attendance.service";
import type { ShiftAssignment } from "../../../types/shift";
import type {
  AttendanceAdjustRequest,
  AttendanceRecord,
  AttendanceStatus,
} from "../../../types/attendance";
import {
  Fingerprint,
  Clock,
  Calendar,
  History,
  AlertCircle,
  CheckCircle2,
  RefreshCcw,
  CalendarDays,
  Timer,
  ArrowRightLeft,
  X,
} from "lucide-react";

type RangeMode = "DAY" | "WEEK" | "MONTH" | "CUSTOM";

// ===== Helpers (GIỮ NGUYÊN LOGIC CŨ) =====
const getOutletId = (s: any) =>
  s.currentOutletId ||
  s.outletId ||
  s.selectedOutletId ||
  s.currentOutlet?.id ||
  s.outlet?.id ||
  null;

const pad2 = (n: number) => String(n).padStart(2, "0");
const todayYMD = () => new Date().toISOString().slice(0, 10);

const ymdToDate = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map((x) => parseInt(x, 10));
  return new Date(y, (m || 1) - 1, d || 1);
};

const dateToYMD = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const addDays = (ymd: string, days: number) => {
  const d = ymdToDate(ymd);
  d.setDate(d.getDate() + days);
  return dateToYMD(d);
};

const startOfWeekMonday = (ymd: string) => {
  const d = ymdToDate(ymd);
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return dateToYMD(d);
};

const startOfMonth = (ymd: string) => {
  const d = ymdToDate(ymd);
  d.setDate(1);
  return dateToYMD(d);
};

const endOfMonth = (ymd: string) => {
  const d = ymdToDate(ymd);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  return dateToYMD(d);
};

const listDaysBetween = (fromYMD: string, toYMD: string) => {
  const res: string[] = [];
  const from = ymdToDate(fromYMD);
  const to = ymdToDate(toYMD);
  if (from > to) return res;
  const cur = new Date(from);
  while (cur <= to) {
    res.push(dateToYMD(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return res;
};

const isoToLocal = (iso?: string | null) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
};

const isoToLocalTime = (iso?: string | null) => {
  if (!iso) return "--:--";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--:--";
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

/**
 * Ghép workDate + time ("HH:mm") => ISO OffsetDateTime local
 * vd: 2026-01-13 + 18:00 => 2026-01-13T18:00:00+07:00
 */
const workDateAndTimeToOffsetISO = (workDate: string, timeHHmm?: string) => {
  if (!timeHHmm) return null;
  const [hh, mm] = timeHHmm.split(":").map((x) => parseInt(x, 10));
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;

  const base = ymdToDate(workDate);
  base.setHours(hh, mm, 0, 0);

  const yyyy = base.getFullYear();
  const MM = pad2(base.getMonth() + 1);
  const dd = pad2(base.getDate());
  const HH = pad2(base.getHours());
  const MI = pad2(base.getMinutes());
  const SS = pad2(base.getSeconds());

  const tzMin = -base.getTimezoneOffset();
  const sign = tzMin >= 0 ? "+" : "-";
  const abs = Math.abs(tzMin);
  const tzh = pad2(Math.floor(abs / 60));
  const tzm = pad2(abs % 60);

  return `${yyyy}-${MM}-${dd}T${HH}:${MI}:${SS}${sign}${tzh}:${tzm}`;
};

// ===== UI Sub-components (THEO FILE MỚI) =====
function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-300">
      <div
        className="w-full max-w-xl bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div className="text-lg font-black text-slate-900 uppercase tracking-tight">
            {title}
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}

const StatusPill = ({ status }: { status?: string }) => {
  const cfg: Record<string, string> = {
    PRESENT: "bg-emerald-50 text-emerald-700 border-emerald-100",
    LATE: "bg-amber-50 text-amber-700 border-amber-100",
    ABSENT: "bg-rose-50 text-rose-700 border-rose-100",
    PENDING: "bg-blue-50 text-blue-700 border-blue-100",
  };
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wider ${
        cfg[status || ""] || "bg-slate-50 text-slate-500 border-slate-100"
      }`}
    >
      {status || "N/A"}
    </span>
  );
};

export default function MyCheckinPage() {
  const { setTitle } = useOutletContext<AppLayoutContext>();
  useMemo(() => setTitle?.("Điểm danh"), [setTitle]);

  const ctx = useAppContextStore();
  const outletId = getOutletId(ctx) as string | null;
  const ctxReady = !!outletId;

  // ===== Range selector (GIỮ NGUYÊN LOGIC CŨ) =====
  const [mode, setMode] = useState<RangeMode>("DAY");
  const [anchorDay, setAnchorDay] = useState<string>(() => todayYMD());
  const [customFrom, setCustomFrom] = useState<string>(() => todayYMD());
  const [customTo, setCustomTo] = useState<string>(() => todayYMD());

  const computedRange = useMemo(() => {
    if (mode === "DAY") return { from: anchorDay, to: anchorDay };
    if (mode === "WEEK") {
      const from = startOfWeekMonday(anchorDay);
      return { from, to: addDays(from, 6) };
    }
    if (mode === "MONTH")
      return { from: startOfMonth(anchorDay), to: endOfMonth(anchorDay) };
    return {
      from: customFrom <= customTo ? customFrom : customTo,
      to: customFrom <= customTo ? customTo : customFrom,
    };
  }, [mode, anchorDay, customFrom, customTo]);

  const daysInRange = useMemo(
    () => listDaysBetween(computedRange.from, computedRange.to),
    [computedRange.from, computedRange.to],
  );

  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  useEffect(() => {
    setSelectedDays(daysInRange);
  }, [computedRange.from, computedRange.to]);

  const isDaySelected = (d: string) => selectedDays.includes(d);
  const toggleDay = (d: string) => {
    setSelectedDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );
  };

  // ===== Raw data fetch (GIỮ NGUYÊN LOGIC CŨ) =====
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const [rawShifts, setRawShifts] = useState<ShiftAssignment[]>([]);
  const [rawAttendance, setRawAttendance] = useState<AttendanceRecord[]>([]);

  const myShifts = useMemo(() => {
    if (!selectedDays.length) return [];
    const setDays = new Set(selectedDays);
    return rawShifts.filter((x: any) => setDays.has(String(x.workDate)));
  }, [rawShifts, selectedDays]);

  const myAttendance = useMemo(() => {
    if (!selectedDays.length) return [];
    const setDays = new Set(selectedDays);
    return rawAttendance.filter((x: any) => setDays.has(String(x.workDate)));
  }, [rawAttendance, selectedDays]);

  const loadAll = async () => {
    if (!outletId) return;
    setLoading(true);
    setError("");
    try {
      const shifts = await shiftService.my({
        outletId,
        dateFrom: computedRange.from,
        dateTo: computedRange.to,
      });
      setRawShifts(shifts ?? []);

      const page = await attendanceService.searchMy({
        outletId,
        dateFrom: computedRange.from,
        dateTo: computedRange.to,
        page: 0,
        size: 200,
      });
      setRawAttendance(page.content ?? []);
    } catch (e: any) {
      const status = e?.response?.status;
      const msg =
        status === 403
          ? "403: Tài khoản hiện tại không có quyền dùng Attendance API. (BE chỉ cho ROOT/OWNER/ADMIN/MANAGER/STAFF)"
          : e?.response?.data?.message ||
            e?.message ||
            "Không tải được dữ liệu.";
      setError(msg);
      setRawShifts([]);
      setRawAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ctxReady) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outletId, computedRange.from, computedRange.to]);

  // ===== Clock-in/out (GIỮ NGUYÊN LOGIC CŨ) =====
  const [clockingId, setClockingId] = useState<string>("");

  const doClockIn = async (shiftAssignmentId: string) => {
    if (!outletId) return;
    setClockingId(shiftAssignmentId);
    setError("");
    try {
      await attendanceService.clockIn({ shiftAssignmentId }, outletId);
      await loadAll();
    } catch (e: any) {
      const status = e?.response?.status;
      const msg =
        status === 403
          ? "Bạn không có quyền Clock-in (403). Tài khoản phải có authority STAFF/MANAGER/ADMIN..."
          : e?.response?.data?.message || e?.message || "Clock-in thất bại.";
      setError(msg);
    } finally {
      setClockingId("");
    }
  };

  const doClockOut = async (shiftAssignmentId: string) => {
    if (!outletId) return;
    setClockingId(shiftAssignmentId);
    setError("");
    try {
      await attendanceService.clockOut({ shiftAssignmentId }, outletId);
      await loadAll();
    } catch (e: any) {
      const status = e?.response?.status;
      const msg =
        status === 403
          ? "Bạn không có quyền Clock-out (403). Tài khoản phải có authority STAFF/MANAGER/ADMIN..."
          : e?.response?.data?.message || e?.message || "Clock-out thất bại.";
      setError(msg);
    } finally {
      setClockingId("");
    }
  };

  // ===== Adjust modal (GIỮ NGUYÊN LOGIC CŨ) =====
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustSaving, setAdjustSaving] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<AttendanceRecord | null>(
    null,
  );

  const [reqInTime, setReqInTime] = useState<string>("");
  const [reqOutTime, setReqOutTime] = useState<string>("");
  const [reqStatus, setReqStatus] = useState<AttendanceStatus | "">("");
  const [reason, setReason] = useState("");

  const openAdjust = (r: AttendanceRecord) => {
    setAdjustTarget(r);

    const toHHmm = (iso?: string | null) => {
      if (!iso) return "";
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return "";
      return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
    };

    setReqInTime(toHHmm(r.clockInTime));
    setReqOutTime(toHHmm(r.clockOutTime));
    setReqStatus(r.status ?? "");
    setReason("");
    setAdjustOpen(true);
  };

  const submitAdjust = async () => {
    if (!adjustTarget || !outletId) return;
    setAdjustSaving(true);
    setError("");
    try {
      const payload: AttendanceAdjustRequest = {
        requestedClockInTime: workDateAndTimeToOffsetISO(
          adjustTarget.workDate,
          reqInTime,
        ),
        requestedClockOutTime: workDateAndTimeToOffsetISO(
          adjustTarget.workDate,
          reqOutTime,
        ),
        requestedStatus: (reqStatus || null) as any,
        reason: reason || null,
      };

      await attendanceService.requestAdjustment(
        adjustTarget.id,
        payload,
        outletId,
      );

      setAdjustOpen(false);
      setAdjustTarget(null);
      await loadAll();
    } catch (e: any) {
      const status = e?.response?.status;
      const msg =
        status === 403
          ? "Bạn không có quyền gửi yêu cầu chỉnh công (403)."
          : e?.response?.data?.message ||
            e?.message ||
            "Gửi yêu cầu chỉnh công thất bại.";
      setError(msg);
    } finally {
      setAdjustSaving(false);
    }
  };

  // ===== UI-only helpers (không đụng logic BE) =====
  const todayShifts = useMemo(
    () => myShifts.filter((s: any) => String(s.workDate) === todayYMD()),
    [myShifts],
  );

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const hasCheckinForShift = (shiftId: string) =>
    rawAttendance.some(
      (a: any) => a.shiftAssignmentId === shiftId && a.clockInTime,
    );

  const hasCheckoutForShift = (shiftId: string) =>
    rawAttendance.some(
      (a: any) => a.shiftAssignmentId === shiftId && a.clockOutTime,
    );

  return (
    <div className="flex flex-col gap-6 lg:gap-8 max-w-4xl mx-auto pb-32 animate-in fade-in duration-700">
      {!outletId && (
        <div className="rounded-[2rem] bg-amber-50 border border-amber-200 p-6 text-amber-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5" size={20} />
            <div className="space-y-1">
              <div className="text-xs font-black uppercase tracking-widest">
                Chưa chọn outlet
              </div>
              <div className="text-sm font-medium">
                Hãy chọn outlet ở sidebar/topbar để điểm danh.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HERO ACTION ZONE (UI mới) */}
      <section className="bg-slate-900 rounded-[2.5rem] p-8 lg:p-12 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />

        <div className="relative z-10 space-y-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Fingerprint size={18} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">
                  Hệ thống điểm danh
                </span>
              </div>
              <h2 className="text-3xl lg:text-5xl font-black tracking-tight leading-none">
                Hôm nay,{" "}
                {currentTime.toLocaleDateString("vi-VN", {
                  weekday: "long",
                  day: "numeric",
                  month: "numeric",
                })}
              </h2>
              <div className="flex items-center gap-3 text-blue-400 font-bold text-xl tracking-tighter">
                <Clock size={20} />
                {currentTime.toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </div>
            </div>

            <button
              onClick={loadAll}
              disabled={!ctxReady || loading}
              className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all border border-white/5 active:scale-90 disabled:opacity-30"
              title="Làm mới"
            >
              <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todayShifts.length > 0 ? (
              todayShifts.map((shift: any) => {
                const busy = clockingId === shift.id;
                const hasIn = hasCheckinForShift(shift.id);
                const hasOut = hasCheckoutForShift(shift.id);

                return (
                  <div
                    key={shift.id}
                    className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6 backdrop-blur-md"
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                          {shift.workShiftName || "Ca linh hoạt"}
                        </p>
                        <p className="text-lg font-black">
                          {String(shift.startTime).slice(0, 5)} -{" "}
                          {String(shift.endTime).slice(0, 5)}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-white/10 rounded-xl text-[10px] font-black uppercase border border-white/5 tracking-widest">
                        {shift.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        disabled={!ctxReady || busy || hasIn}
                        onClick={() => doClockIn(shift.id)}
                        className={`h-16 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl ${
                          hasIn
                            ? "bg-white/5 text-white/20 border border-white/5"
                            : "bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/20"
                        }`}
                      >
                        {busy ? (
                          <RefreshCcw className="animate-spin" size={18} />
                        ) : (
                          <Fingerprint size={18} />
                        )}
                        {hasIn ? "Đã vào ca" : "Vào ca"}
                      </button>

                      <button
                        disabled={!ctxReady || busy || !hasIn || hasOut}
                        onClick={() => doClockOut(shift.id)}
                        className={`h-16 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl ${
                          hasOut || !hasIn
                            ? "bg-white/5 text-white/20 border border-white/5"
                            : "bg-rose-600 text-white hover:bg-rose-500 shadow-rose-600/20"
                        }`}
                      >
                        {busy ? (
                          <RefreshCcw className="animate-spin" size={18} />
                        ) : (
                          <Timer size={18} />
                        )}
                        {hasOut ? "Đã ra ca" : "Ra ca"}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-3 opacity-50 col-span-full">
                <CalendarDays size={48} className="text-slate-600" />
                <p className="text-sm font-black uppercase tracking-widest">
                  Không có lịch làm hôm nay
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {error && (
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-[2rem] flex items-center gap-4 text-rose-600 animate-in slide-in-from-top-4">
          <AlertCircle size={24} className="shrink-0" />
          <p className="text-xs font-black uppercase leading-relaxed tracking-widest">
            {error}
          </p>
        </div>
      )}

      {/* FILTERS (UI mới, logic cũ) */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <Calendar size={14} /> Lịch trình & Lịch sử
          </h3>

          <div className="flex bg-slate-100 p-1 rounded-xl">
            {(["DAY", "WEEK", "MONTH", "CUSTOM"] as RangeMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                disabled={!ctxReady}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 ${
                  mode === m
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 p-6 lg:p-8 space-y-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mode !== "CUSTOM" ? (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Chọn ngày mốc
                </label>
                <input
                  type="date"
                  value={anchorDay}
                  onChange={(e) => setAnchorDay(e.target.value)}
                  disabled={!ctxReady}
                  className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 text-xs font-black outline-none focus:ring-4 focus:ring-blue-600/5 disabled:opacity-50"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Từ ngày
                  </label>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    disabled={!ctxReady}
                    className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 text-xs font-black outline-none disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Đến ngày
                  </label>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    disabled={!ctxReady}
                    className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 text-xs font-black outline-none disabled:opacity-50"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col justify-end">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs font-black text-slate-500 uppercase tracking-tighter">
                <span>{computedRange.from}</span>
                <ArrowRightLeft size={14} className="text-slate-300" />
                <span>{computedRange.to}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Chọn ngày xem dữ liệu
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedDays(daysInRange)}
                  disabled={!ctxReady}
                  className="text-[9px] font-black text-blue-600 hover:underline uppercase tracking-widest disabled:opacity-50"
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setSelectedDays([])}
                  disabled={!ctxReady}
                  className="text-[9px] font-black text-slate-400 hover:underline uppercase tracking-widest disabled:opacity-50"
                >
                  Bỏ chọn
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {daysInRange.map((d) => (
                <button
                  key={d}
                  onClick={() => toggleDay(d)}
                  disabled={!ctxReady}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black border transition-all disabled:opacity-50 ${
                    isDaySelected(d)
                      ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/10"
                      : "bg-white border-slate-100 text-slate-500 hover:border-blue-200"
                  }`}
                >
                  {d.slice(5)}
                </button>
              ))}

              {daysInRange.length === 0 && (
                <div className="text-xs font-bold text-slate-400">
                  Khoảng ngày không hợp lệ.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SHIFTS LIST (UI mới - card, logic cũ) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <Timer size={14} /> Lịch trình chi tiết
          </h3>
          <span className="text-[10px] font-black text-slate-400">
            {loading ? "..." : `${myShifts.length} Ca`}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {myShifts.map((a: any) => (
            <div
              key={a.id}
              className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-4 group hover:shadow-xl transition-all duration-500"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm font-black text-slate-900">
                    {a.workDate}
                  </p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {a.workShiftName || "Flexible"}
                  </p>
                </div>
                <StatusPill status={a.status} />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-blue-50 transition-colors">
                <div className="flex items-center gap-3">
                  <Clock size={16} className="text-blue-500" />
                  <span className="text-xs font-black text-slate-700">
                    {String(a.startTime).slice(0, 5)} -{" "}
                    {String(a.endTime).slice(0, 5)}
                  </span>
                </div>
                <span className="text-[9px] font-bold text-slate-400 italic">
                  Nghỉ {a.breakMinutes || 0}m
                </span>
              </div>
            </div>
          ))}

          {myShifts.length === 0 && !loading && (
            <div className="col-span-full py-12 bg-white rounded-[2rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 gap-2 opacity-50">
              <CalendarDays size={32} />
              <p className="text-[10px] font-black uppercase tracking-widest">
                Không có dữ liệu ca làm
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ATTENDANCE HISTORY (UI mới, logic cũ) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <History size={14} /> Lịch sử chấm công
          </h3>
          <span className="text-[10px] font-black text-slate-400">
            {loading ? "..." : `${myAttendance.length} Bản ghi`}
          </span>
        </div>

        <div className="space-y-3">
          {myAttendance.map((r: any) => (
            <div
              key={r.id}
              className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 hover:border-blue-200 transition-all"
            >
              <div className="flex items-center gap-5 min-w-0">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 shrink-0 border border-slate-100">
                  <Fingerprint size={24} />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-black text-slate-900">
                    {r.workDate}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                      <Clock size={10} className="text-blue-500" />{" "}
                      {isoToLocalTime(r.clockInTime)} -{" "}
                      {isoToLocalTime(r.clockOutTime)}
                    </span>
                    <StatusPill status={r.status} />
                  </div>

                  {/* pending detail (GIỮ NGUYÊN thông tin như file cũ) */}
                  {r.hasPendingAdjust && (
                    <div className="mt-2 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-lg border bg-amber-50 text-amber-800 border-amber-200">
                          PENDING
                        </span>
                        <span className="text-slate-700 font-medium">
                          In: {isoToLocal(r.requestedClockInTime)} | Out:{" "}
                          {isoToLocal(r.requestedClockOutTime)}
                        </span>
                      </div>
                      {r.requestedReason && (
                        <div className="mt-1">Lý do: {r.requestedReason}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-4 md:pt-0">
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Thời gian làm
                  </p>
                  <p className="text-sm font-black text-slate-800">
                    {r.totalWorkMinutes ?? 0} phút
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {r.hasPendingAdjust && (
                    <span className="px-2 py-1 bg-amber-50 text-amber-700 text-[9px] font-black rounded-lg border border-amber-100 animate-pulse">
                      PENDING
                    </span>
                  )}

                  <button
                    onClick={() => openAdjust(r)}
                    disabled={r.hasPendingAdjust}
                    title={
                      r.hasPendingAdjust
                        ? "Bạn đã có yêu cầu pending"
                        : "Tạo yêu cầu chỉnh công"
                    }
                    className="h-10 px-4 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-20"
                  >
                    Chỉnh công
                  </button>
                </div>
              </div>
            </div>
          ))}

          {myAttendance.length === 0 && !loading && (
            <div className="py-12 bg-white rounded-[2rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 gap-2 opacity-50">
              <CalendarDays size={32} />
              <p className="text-[10px] font-black uppercase tracking-widest">
                Không có dữ liệu chấm công
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ADJUST MODAL (UI mới, logic cũ) */}
      <Modal
        open={adjustOpen}
        title="Yêu cầu chỉnh công"
        onClose={() => {
          if (adjustSaving) return;
          setAdjustOpen(false);
          setAdjustTarget(null);
        }}
      >
        {!adjustTarget ? null : (
          <div className="space-y-8 pb-4">
            <div className="p-6 bg-slate-900 rounded-3xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl -mr-16 -mt-16" />
              <div className="relative z-10 flex items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                    Dữ liệu gốc
                  </p>
                  <p className="text-xl font-black truncate">
                    {adjustTarget.workDate}
                  </p>
                  <p className="text-[10px] text-slate-300">
                    AttendanceId:{" "}
                    <span className="font-mono">{adjustTarget.id}</span>
                  </p>
                </div>

                <div className="text-right space-y-1 shrink-0">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    In/Out hiện tại
                  </p>
                  <p className="text-sm font-bold opacity-80">
                    {isoToLocalTime(adjustTarget.clockInTime)} -{" "}
                    {isoToLocalTime(adjustTarget.clockOutTime)}
                  </p>
                  <p className="text-[10px] text-slate-300">
                    Status:{" "}
                    <span className="font-semibold">{adjustTarget.status}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Chọn giờ dễ (GIỮ NGUYÊN: input time + show ISO sẽ gửi) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Clock-in mong muốn
                </label>
                <input
                  type="time"
                  value={reqInTime}
                  onChange={(e) => setReqInTime(e.target.value)}
                  className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-sm font-black outline-none focus:ring-4 focus:ring-blue-600/5 transition-all"
                />
                <div className="text-[10px] text-slate-400">
                  Sẽ gửi:{" "}
                  <span className="font-mono">
                    {workDateAndTimeToOffsetISO(
                      adjustTarget.workDate,
                      reqInTime,
                    ) ?? "-"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Clock-out mong muốn
                </label>
                <input
                  type="time"
                  value={reqOutTime}
                  onChange={(e) => setReqOutTime(e.target.value)}
                  className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-sm font-black outline-none focus:ring-4 focus:ring-blue-600/5 transition-all"
                />
                <div className="text-[10px] text-slate-400">
                  Sẽ gửi:{" "}
                  <span className="font-mono">
                    {workDateAndTimeToOffsetISO(
                      adjustTarget.workDate,
                      reqOutTime,
                    ) ?? "-"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Trạng thái yêu cầu
              </label>
              <select
                value={reqStatus}
                onChange={(e) => setReqStatus(e.target.value as any)}
                className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-xs font-black uppercase outline-none transition-all cursor-pointer"
              >
                <option value="">-- GIỮ NGUYÊN --</option>
                <option value="PRESENT">ĐI LÀM (PRESENT)</option>
                <option value="LATE">ĐI MUỘN (LATE)</option>
                <option value="ABSENT">VẮNG MẶT (ABSENT)</option>
              </select>
              <div className="text-[10px] text-slate-400">
                (Chỉ chọn các status BE chấp nhận)
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Lý do điều chỉnh
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-6 text-xs font-medium outline-none focus:ring-4 focus:ring-blue-600/5 transition-all"
                placeholder="Ví dụ: vào đúng giờ nhưng máy quét lỗi..."
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-50">
              <button
                disabled={adjustSaving}
                onClick={() => {
                  if (adjustSaving) return;
                  setAdjustOpen(false);
                  setAdjustTarget(null);
                }}
                className="h-14 px-8 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                Hủy bỏ
              </button>

              <button
                disabled={adjustSaving}
                onClick={submitAdjust}
                className="h-14 flex-1 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-30"
              >
                {adjustSaving ? (
                  <RefreshCcw className="animate-spin" size={18} />
                ) : (
                  <CheckCircle2 size={18} />
                )}
                {adjustSaving ? "Đang gửi..." : "Gửi yêu cầu điều chỉnh"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
