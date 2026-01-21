// src/features/attendance/pages/AttendancePage.tsx
import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { AppLayoutContext } from "../../../layout/AppLayout";
import { attendanceService } from "../../../api/services/attendance.service";
import { staffService } from "../../../api/services/staff.service";
import type {
  AttendanceRecord,
  AttendanceStatus,
} from "../../../types/attendance";
import type { StaffOption } from "../../../types/staff";
import { useAppContextStore } from "../../../store/useAppContextStore";

const getOutletId = (s: any) =>
  s.currentOutletId ||
  s.outletId ||
  s.selectedOutletId ||
  s.currentOutlet?.id ||
  s.outlet?.id ||
  null;

const isoToLocal = (iso?: string | null) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
};

function Badge({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "gray" | "yellow" | "green" | "red" | "blue";
}) {
  const map: Record<string, string> = {
    gray: "bg-slate-100 text-slate-700 border-slate-200",
    yellow: "bg-amber-50 text-amber-800 border-amber-200",
    green: "bg-emerald-50 text-emerald-800 border-emerald-200",
    red: "bg-rose-50 text-rose-800 border-rose-200",
    blue: "bg-sky-50 text-sky-800 border-sky-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-lg border text-xs ${map[tone]}`}
    >
      {children}
    </span>
  );
}

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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div className="text-lg font-semibold">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1 hover:bg-slate-100"
          >
            Đóng
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export default function AttendancePage() {
  const { setTitle } = useOutletContext<AppLayoutContext>();
  useMemo(() => setTitle?.("Chấm công"), [setTitle]);

  const ctx = useAppContextStore();
  const outletId = getOutletId(ctx) as string | null;

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<AttendanceRecord[]>([]);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);

  const [staffId, setStaffId] = useState<string>("");
  const [status, setStatus] = useState<AttendanceStatus | "">("");

  const [dateFrom, setDateFrom] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [dateTo, setDateTo] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );

  const [error, setError] = useState<string>("");

  // approve/reject modal
  const [actionOpen, setActionOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMode, setActionMode] = useState<"approve" | "reject">("approve");
  const [actionNote, setActionNote] = useState("");
  const [target, setTarget] = useState<AttendanceRecord | null>(null);

  const ctxReady = !!outletId;

  useEffect(() => {
    if (!outletId) return;
    staffService
      .options(outletId)
      .then((opts) => setStaffOptions(opts ?? []))
      .catch(() => setStaffOptions([]));
  }, [outletId]);

  const fetchData = async () => {
    if (!outletId) return;
    setLoading(true);
    setError("");
    try {
      const page = await attendanceService.search({
        outletId,
        dateFrom,
        dateTo,
        staffId: staffId || undefined,
        status: status || undefined,
        page: 0,
        size: 50,
      });
      setRows(page.content ?? []);
    } catch (e: any) {
      const msg =
        e?.response?.status === 403
          ? "Bạn không có quyền xem chấm công (403)."
          : e?.response?.data?.message ||
            e?.message ||
            "Có lỗi xảy ra khi tải dữ liệu.";
      setError(msg);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ctxReady) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outletId]);

  const openAction = (r: AttendanceRecord, mode: "approve" | "reject") => {
    setTarget(r);
    setActionMode(mode);
    setActionNote("");
    setActionOpen(true);
  };

  const submitAction = async () => {
    if (!target) return;
    setActionLoading(true);
    setError("");
    try {
      await attendanceService.approveAdjustment(
        target.id,
        { approve: actionMode === "approve", note: actionNote || undefined },
        outletId
      );
      setActionOpen(false);
      setTarget(null);
      await fetchData();
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        (e?.response?.status === 403
          ? "Bạn không có quyền duyệt chỉnh công (403)."
          : "") ||
        e?.message ||
        "Không thể duyệt/từ chối.";
      setError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!outletId && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-amber-800">
          Bạn chưa chọn outlet. Hãy chọn outlet ở sidebar/topbar để xem chấm
          công.
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-rose-800">
          {error}
        </div>
      )}

      <div className="p-4 rounded-2xl border bg-white">
        <div className="text-lg font-semibold mb-3">Bộ lọc</div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="text-sm text-gray-600">Từ ngày</label>
            <input
              className="w-full border rounded-xl px-3 py-2"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              disabled={!ctxReady}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Đến ngày</label>
            <input
              className="w-full border rounded-xl px-3 py-2"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              disabled={!ctxReady}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Nhân viên</label>
            <select
              className="w-full border rounded-xl px-3 py-2 bg-white"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              disabled={!ctxReady}
            >
              <option value="">Tất cả</option>
              {staffOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label ?? s.name ?? s.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600">Trạng thái</label>
            <select
              className="w-full border rounded-xl px-3 py-2 bg-white"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              disabled={!ctxReady}
            >
              <option value="">Tất cả</option>
              <option value="PRESENT">PRESENT</option>
              <option value="LATE">LATE</option>
              <option value="ABSENT">ABSENT</option>
              <option value="ADJUSTMENT_PENDING">ADJUSTMENT_PENDING</option>
              <option value="ADJUSTED">ADJUSTED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              className="w-full px-3 py-2 rounded-xl bg-black text-white disabled:opacity-50"
              onClick={fetchData}
              disabled={!ctxReady || loading}
            >
              {loading ? "Đang tải..." : "Tìm"}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="font-semibold">Danh sách chấm công</div>
          <div className="text-sm text-slate-600">
            {loading ? "Đang tải..." : `${rows.length} bản ghi`}
          </div>
        </div>

        <div className="overflow-auto">
          <table className="min-w-[1200px] w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-slate-600">
                <th className="p-3">Ngày</th>
                <th className="p-3">Nhân viên</th>
                <th className="p-3">Clock-in</th>
                <th className="p-3">Clock-out</th>
                <th className="p-3">Phút</th>
                <th className="p-3">Status</th>
                <th className="p-3">Yêu cầu chỉnh công</th>
                <th className="p-3 text-right">Duyệt</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => {
                const pending = !!r.hasPendingAdjust;
                return (
                  <tr key={r.id} className="border-t">
                    <td className="p-3">{r.workDate}</td>
                    <td className="p-3">{r.staffName ?? r.staffId}</td>
                    <td className="p-3">{isoToLocal(r.clockInTime)}</td>
                    <td className="p-3">{isoToLocal(r.clockOutTime)}</td>
                    <td className="p-3">{r.totalWorkMinutes ?? "-"}</td>
                    <td className="p-3">
                      <Badge
                        tone={
                          r.status === "ABSENT"
                            ? "red"
                            : r.status === "LATE"
                            ? "yellow"
                            : r.status === "PRESENT"
                            ? "green"
                            : "gray"
                        }
                      >
                        {r.status}
                      </Badge>
                    </td>

                    <td className="p-3">
                      {!pending ? (
                        <span className="text-slate-500">-</span>
                      ) : (
                        <div className="space-y-1">
                          <div>
                            <Badge tone="yellow">PENDING</Badge>
                          </div>
                          <div className="text-xs text-slate-700">
                            <div>
                              In:{" "}
                              <span className="font-medium">
                                {isoToLocal(r.requestedClockInTime)}
                              </span>
                            </div>
                            <div>
                              Out:{" "}
                              <span className="font-medium">
                                {isoToLocal(r.requestedClockOutTime)}
                              </span>
                            </div>
                            <div>
                              Status:{" "}
                              <span className="font-medium">
                                {r.requestedStatus ?? "-"}
                              </span>
                            </div>
                            {r.requestedReason && (
                              <div className="text-slate-600">
                                Lý do:{" "}
                                <span className="font-medium">
                                  {r.requestedReason}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </td>

                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="rounded-xl border px-3 py-2 hover:bg-slate-50 disabled:opacity-50"
                          disabled={!pending}
                          onClick={() => openAction(r, "approve")}
                        >
                          Duyệt
                        </button>
                        <button
                          type="button"
                          className="rounded-xl border border-rose-200 text-rose-700 px-3 py-2 hover:bg-rose-50 disabled:opacity-50"
                          disabled={!pending}
                          onClick={() => openAction(r, "reject")}
                        >
                          Từ chối
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {rows.length === 0 && !loading && (
                <tr>
                  <td className="p-4 text-gray-500" colSpan={8}>
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={actionOpen}
        title={
          actionMode === "approve"
            ? "Duyệt yêu cầu chỉnh công"
            : "Từ chối yêu cầu chỉnh công"
        }
        onClose={() => {
          if (actionLoading) return;
          setActionOpen(false);
          setTarget(null);
        }}
      >
        {!target ? null : (
          <div className="space-y-4">
            <div className="rounded-xl border bg-slate-50 p-4 text-sm">
              <div className="font-semibold mb-1">
                {target.workDate} — {target.staffName ?? target.staffId}
              </div>
              <div className="text-slate-700">
                <div>
                  Requested In:{" "}
                  <span className="font-medium">
                    {isoToLocal(target.requestedClockInTime)}
                  </span>
                </div>
                <div>
                  Requested Out:{" "}
                  <span className="font-medium">
                    {isoToLocal(target.requestedClockOutTime)}
                  </span>
                </div>
                <div>
                  Requested Status:{" "}
                  <span className="font-medium">
                    {target.requestedStatus ?? "-"}
                  </span>
                </div>
                {target.requestedReason && (
                  <div className="text-slate-600">
                    Lý do:{" "}
                    <span className="font-medium">
                      {target.requestedReason}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Ghi chú (optional)</label>
              <textarea
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border px-3 py-2"
                placeholder="Ghi chú cho staff..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded-xl px-4 py-2 hover:bg-slate-100"
                onClick={() => {
                  if (actionLoading) return;
                  setActionOpen(false);
                  setTarget(null);
                }}
              >
                Hủy
              </button>

              <button
                type="button"
                className={`rounded-xl px-4 py-2 text-white disabled:opacity-50 ${
                  actionMode === "approve" ? "bg-slate-900" : "bg-rose-600"
                }`}
                disabled={actionLoading}
                onClick={submitAction}
              >
                {actionLoading
                  ? "Đang xử lý..."
                  : actionMode === "approve"
                  ? "Duyệt"
                  : "Từ chối"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
