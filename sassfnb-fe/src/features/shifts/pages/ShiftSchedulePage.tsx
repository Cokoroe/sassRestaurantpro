import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { AppLayoutContext } from "../../../layout/AppLayout";
import { useShiftAssignments } from "../hooks/useShiftAssignments";
import { useShiftTemplates } from "../hooks/useShiftTemplates";
import { staffService } from "../../../api/services/staff.service";
import { shiftService } from "../../../api/services/shift.service";
import type {
  ShiftAssignment,
  ShiftTemplate,
  ShiftUpdateRequest,
} from "../../../types/shift";
import type { StaffOption } from "../../../types/staff";
import ShiftBulkScheduleDialog from "../components/ShiftBulkScheduleDialog";
import ShiftAssignmentDialog from "../components/ShiftAssignmentDialog";
import ConfirmDialog from "../components/ConfirmDialog";
import { ShiftToast, type ShiftToastState } from "../components/ShiftToast";

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "ASSIGNED"
      ? "bg-slate-50 text-slate-700 border-slate-200"
      : status === "CANCELED"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : status === "CLOSED" || status === "DONE"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-amber-50 text-amber-800 border-amber-200";
  return (
    <span className={`inline-flex px-2 py-1 rounded-lg border ${cls}`}>
      {status}
    </span>
  );
}

export default function ShiftSchedulePage() {
  const { setTitle } = useOutletContext<AppLayoutContext>();
  useMemo(() => setTitle?.("Xếp lịch (Shift Schedule)"), [setTitle]);

  const a = useShiftAssignments();
  const t = useShiftTemplates();

  const ctxReady = !!a.outletId;

  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);

  const [bulkOpen, setBulkOpen] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ShiftAssignment | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<ShiftAssignment | null>(
    null
  );
  const [confirmMode, setConfirmMode] = useState<"close" | "reopen">("close");

  const [toast, setToast] = useState<ShiftToastState>({
    open: false,
    kind: "info",
    message: "",
  });

  const loadStaffOptions = async () => {
    if (!a.outletId) return;
    setStaffLoading(true);
    try {
      const res = await staffService.options(a.outletId);
      setStaffOptions(res ?? []);
    } finally {
      setStaffLoading(false);
    }
  };

  // lazy load staff options when open bulk/edit
  const openBulk = async () => {
    if (!ctxReady) return;
    if (staffOptions.length === 0) await loadStaffOptions();
    setBulkOpen(true);
  };

  const openEdit = async (x: ShiftAssignment) => {
    if (!ctxReady) return;
    if (staffOptions.length === 0) await loadStaffOptions();
    setEditing(x);
    setEditOpen(true);
  };

  const askClose = (x: ShiftAssignment) => {
    setConfirmMode("close");
    setConfirmTarget(x);
    setConfirmOpen(true);
  };

  const askReopen = (x: ShiftAssignment) => {
    setConfirmMode("reopen");
    setConfirmTarget(x);
    setConfirmOpen(true);
  };

  const doConfirm = async () => {
    if (!confirmTarget) return;
    setConfirmLoading(true);
    try {
      const nextStatus = confirmMode === "close" ? "CLOSED" : "ASSIGNED";
      await shiftService.updateAssignmentStatus(confirmTarget.id, {
        status: nextStatus,
      });
      setToast({
        open: true,
        kind: "success",
        message: `Đã cập nhật status: ${nextStatus}`,
      });
      setConfirmOpen(false);
      setConfirmTarget(null);
      await a.refresh();
    } catch (e: any) {
      setToast({
        open: true,
        kind: "error",
        message: e?.message || "Không thể cập nhật status.",
      });
    } finally {
      setConfirmLoading(false);
    }
  };

  const onBulkSubmit = async (payload: any) => {
    try {
      await shiftService.schedule(payload);
      setToast({ open: true, kind: "success", message: "Đã xếp lịch." });
      await a.refresh();
    } catch (e: any) {
      setToast({
        open: true,
        kind: "error",
        message: e?.message || "Không thể xếp lịch.",
      });
      throw e;
    }
  };

  const onEditSubmit = async (payload: ShiftUpdateRequest) => {
    if (!editing) return;
    try {
      await shiftService.updateAssignment(editing.id, payload);
      setToast({ open: true, kind: "success", message: "Đã cập nhật ca." });
      await a.refresh();
    } catch (e: any) {
      setToast({
        open: true,
        kind: "error",
        message: e?.message || "Không thể cập nhật ca.",
      });
      throw e;
    }
  };

  const templates: ShiftTemplate[] = t.rows ?? [];

  return (
    <div className="space-y-4">
      <ShiftToast
        state={toast}
        onClose={() => setToast((s) => ({ ...s, open: false }))}
      />

      {/* Filters */}
      <div className="p-4 rounded-2xl border bg-white space-y-3">
        <div className="flex flex-col md:flex-row gap-3 md:items-end">
          <div>
            <label className="text-sm text-gray-600">Từ ngày</label>
            <input
              type="date"
              className="w-full border rounded-xl px-3 py-2"
              value={a.dateFrom}
              onChange={(e) => a.setDateFrom(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Đến ngày</label>
            <input
              type="date"
              className="w-full border rounded-xl px-3 py-2"
              value={a.dateTo}
              onChange={(e) => a.setDateTo(e.target.value)}
            />
          </div>

          <div className="w-full md:w-72">
            <label className="text-sm text-gray-600">Staff (optional)</label>
            <input
              className="w-full border rounded-xl px-3 py-2"
              value={a.staffId}
              onChange={(e) => a.setStaffId(e.target.value)}
              placeholder="staffId (optional)"
            />
          </div>

          <div className="w-full md:w-52">
            <label className="text-sm text-gray-600">Status</label>
            <select
              className="w-full border rounded-xl px-3 py-2 bg-white"
              value={a.status}
              onChange={(e) => a.setStatus(e.target.value)}
            >
              <option value="">ALL</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="CANCELED">CANCELED</option>
              <option value="CLOSED">CLOSED</option>
              <option value="DONE">DONE</option>
            </select>
          </div>

          <button
            className="px-4 py-2 rounded-xl border hover:bg-slate-50 disabled:opacity-50"
            onClick={a.refresh}
            disabled={a.loading || !ctxReady}
          >
            Tải
          </button>

          <button
            className="px-4 py-2 rounded-xl bg-slate-900 text-white disabled:opacity-50"
            onClick={openBulk}
            disabled={!ctxReady}
            title={!ctxReady ? "Cần chọn Outlet trước" : ""}
          >
            + Xếp lịch
          </button>
        </div>

        {!ctxReady && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-amber-800 text-sm">
            Bạn chưa chọn Outlet. Hãy chọn ở sidebar/topbar trước.
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border bg-white overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="font-semibold">Assignments</div>
          <div className="text-sm text-slate-600">
            {a.loading ? "Đang tải..." : `${a.rows.length} ca`}
          </div>
        </div>

        <div className="overflow-auto">
          <table className="min-w-[1200px] w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr className="text-left">
                <th className="p-3">Date</th>
                <th className="p-3">Staff</th>
                <th className="p-3">Template</th>
                <th className="p-3">Time</th>
                <th className="p-3">Break</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {a.rows.map((x) => (
                <tr key={x.id} className="border-t">
                  <td className="p-3">{x.workDate}</td>
                  <td className="p-3">
                    <div className="font-medium">
                      {x.staffName ?? x.staffId}
                    </div>
                    <div className="text-xs text-slate-500">
                      {x.staffId.slice(0, 8)}...
                    </div>
                  </td>
                  <td className="p-3">{x.workShiftName ?? "-"}</td>
                  <td className="p-3">
                    {String(x.startTime).slice(0, 5)} -{" "}
                    {String(x.endTime).slice(0, 5)}
                  </td>
                  <td className="p-3">{x.breakMinutes ?? 0}</td>
                  <td className="p-3">
                    <StatusBadge status={x.status} />
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(x)}
                        className="rounded-xl border px-3 py-2 hover:bg-slate-50"
                      >
                        Sửa
                      </button>

                      {x.status === "CLOSED" || x.status === "DONE" ? (
                        <button
                          onClick={() => askReopen(x)}
                          className="rounded-xl border px-3 py-2 hover:bg-slate-50"
                        >
                          Mở lại
                        </button>
                      ) : (
                        <button
                          onClick={() => askClose(x)}
                          className="rounded-xl border px-3 py-2 hover:bg-slate-50"
                        >
                          Chốt
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {a.rows.length === 0 && !a.loading && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500">
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialogs */}
      {ctxReady && (
        <ShiftBulkScheduleDialog
          open={bulkOpen}
          ctxOutletId={a.outletId!}
          staffOptions={staffOptions}
          templates={templates}
          onClose={() => setBulkOpen(false)}
          onSubmit={onBulkSubmit}
        />
      )}

      <ShiftAssignmentDialog
        open={editOpen}
        initial={editing}
        staffOptions={staffOptions}
        templates={templates}
        onClose={() => setEditOpen(false)}
        onSubmit={onEditSubmit}
      />

      <ConfirmDialog
        open={confirmOpen}
        title={confirmMode === "close" ? "Chốt ca?" : "Mở lại ca?"}
        description={
          confirmTarget
            ? `${confirmTarget.workDate} - ${
                confirmTarget.staffName ?? confirmTarget.staffId
              }`
            : ""
        }
        confirmText={confirmMode === "close" ? "Chốt" : "Mở lại"}
        loading={confirmLoading}
        onClose={() => {
          if (confirmLoading) return;
          setConfirmOpen(false);
          setConfirmTarget(null);
        }}
        onConfirm={doConfirm}
      />

      {/* hidden: staff options loader state */}
      {(staffLoading || t.loading) && (
        <div className="text-xs text-slate-500">
          Đang tải dữ liệu phụ trợ...
        </div>
      )}
    </div>
  );
}
