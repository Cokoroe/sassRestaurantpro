import { useEffect, useMemo, useState } from "react";
import { shiftService } from "../../../api/services/shift.service";
import { staffService } from "../../../api/services/staff.service";
import type {
  ShiftAssignment,
  ShiftScheduleRequest,
  ShiftTemplate,
  ShiftUpdateRequest,
} from "../../../types/shift";
import type { StaffOption } from "../../../types/staff";
import { useAppContextStore } from "../../../store/useAppContextStore";
import ConfirmDialog from "../components/ConfirmDialog";
import { ShiftToast, type ShiftToastState } from "../components/ShiftToast";
import ShiftAssignmentDialog from "../components/ShiftAssignmentDialog";

const getOutletId = (s: any) =>
  s.currentOutletId ||
  s.outletId ||
  s.selectedOutletId ||
  s.currentOutlet?.id ||
  s.outlet?.id ||
  null;

const toHHmmss = (v: string) => (v?.length === 5 ? `${v}:00` : v);

export default function SchedulePanel() {
  const outletId = useAppContextStore((s) => getOutletId(s as any)) as
    | string
    | null;

  const [dateFrom, setDateFrom] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [dateTo, setDateTo] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );

  const [status, setStatus] = useState<string>("");
  const [staffId, setStaffId] = useState<string>("");

  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [items, setItems] = useState<ShiftAssignment[]>([]);
  const [loading, setLoading] = useState(false);

  // quick add
  const [addStaffId, setAddStaffId] = useState("");
  const [addDate, setAddDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [addTemplateId, setAddTemplateId] = useState("");
  const [addStart, setAddStart] = useState("09:00");
  const [addEnd, setAddEnd] = useState("18:00");
  const [addBreak, setAddBreak] = useState(0);

  const [toast, setToast] = useState<ShiftToastState>({
    open: false,
    kind: "info",
    message: "",
  });

  // cancel confirm
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<ShiftAssignment | null>(
    null
  );

  // edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ShiftAssignment | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const canSearch = useMemo(
    () => !!outletId && !!dateFrom && !!dateTo,
    [outletId, dateFrom, dateTo]
  );

  const fetchInit = async () => {
    if (!outletId) return;
    try {
      const [ts, staffs] = await Promise.all([
        shiftService.listTemplates({ outletId }),
        staffService.options(outletId),
      ]);
      setTemplates(ts ?? []);
      setStaffOptions(staffs ?? []);
    } catch (e: any) {
      setToast({
        open: true,
        kind: "error",
        message: e?.message || "Không thể tải danh mục.",
      });
    }
  };

  const search = async () => {
    if (!canSearch) return;
    setLoading(true);
    try {
      const res = await shiftService.search({
        outletId: outletId ?? undefined,
        dateFrom,
        dateTo,
        staffId: staffId || undefined,
        status: status || undefined,
      });
      setItems(res ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outletId]);

  useEffect(() => {
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outletId]);

  const scheduleOne = async () => {
    if (!outletId) return;
    if (!addStaffId) return;

    const payload: ShiftScheduleRequest = {
      outletId: outletId ?? undefined,
      items: [
        {
          staffId: addStaffId,
          workDate: addDate,
          workShiftId: addTemplateId || undefined,
          startTime: addTemplateId ? undefined : toHHmmss(addStart),
          endTime: addTemplateId ? undefined : toHHmmss(addEnd),
          breakMinutes: addBreak,
          status: "ASSIGNED",
        },
      ],
    };

    try {
      await shiftService.schedule(payload);
      setToast({ open: true, kind: "success", message: "Đã xếp ca." });
      await search();
    } catch (e: any) {
      setToast({
        open: true,
        kind: "error",
        message: e?.message || "Không thể xếp ca.",
      });
    }
  };

  // cancel
  const askCancel = (a: ShiftAssignment) => {
    setConfirmTarget(a);
    setConfirmOpen(true);
  };

  const doCancel = async () => {
    if (!confirmTarget) return;
    setConfirmLoading(true);
    try {
      await shiftService.updateAssignmentStatus(confirmTarget.id, {
        status: "CANCELED",
      });
      setToast({
        open: true,
        kind: "success",
        message: "Đã hủy ca (CANCELED).",
      });
      setConfirmOpen(false);
      setConfirmTarget(null);
      await search();
    } catch (e: any) {
      setToast({
        open: true,
        kind: "error",
        message: e?.message || "Không thể hủy ca.",
      });
    } finally {
      setConfirmLoading(false);
    }
  };

  // edit
  const openEdit = (a: ShiftAssignment) => {
    setEditTarget(a);
    setEditOpen(true);
  };

  const submitEdit = async (payload: ShiftUpdateRequest) => {
    if (!editTarget) return;
    setEditSaving(true);
    try {
      await shiftService.updateAssignment(editTarget.id, payload);
      setToast({
        open: true,
        kind: "success",
        message: "Đã cập nhật phân ca.",
      });
      setEditOpen(false);
      setEditTarget(null);
      await search();
    } catch (e: any) {
      setToast({
        open: true,
        kind: "error",
        message: e?.message || "Không thể cập nhật phân ca.",
      });
      throw e;
    } finally {
      setEditSaving(false);
    }
  };

  const ctxReady = !!outletId;

  return (
    <div className="space-y-4">
      <ShiftToast
        state={toast}
        onClose={() => setToast((s) => ({ ...s, open: false }))}
      />

      <div className="rounded-2xl bg-white border p-4 shadow-sm">
        <div className="text-lg font-semibold mb-3">Bộ lọc</div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-xl border px-3 py-2"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-xl border px-3 py-2"
          />
          <select
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            className="rounded-xl border px-3 py-2 bg-white"
          >
            <option value="">Tất cả nhân viên</option>
            {staffOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <input
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border px-3 py-2"
            placeholder="status (ASSIGNED/CANCELED/CLOSED...)"
          />
        </div>

        <div className="mt-3 flex justify-end gap-2">
          <button
            onClick={fetchInit}
            className="rounded-xl border px-4 py-2 hover:bg-slate-50 disabled:opacity-50"
            disabled={!ctxReady}
          >
            Làm mới danh mục
          </button>
          <button
            onClick={search}
            className="rounded-xl bg-slate-900 text-white px-4 py-2 disabled:opacity-50"
            disabled={!ctxReady}
          >
            Tìm
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white border p-4 shadow-sm">
        <div className="text-lg font-semibold mb-3">
          Thêm phân ca nhanh (1 dòng)
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <select
            value={addStaffId}
            onChange={(e) => setAddStaffId(e.target.value)}
            className="rounded-xl border px-3 py-2 md:col-span-2 bg-white"
          >
            <option value="">Chọn nhân viên</option>
            {staffOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={addDate}
            onChange={(e) => setAddDate(e.target.value)}
            className="rounded-xl border px-3 py-2"
          />

          <select
            value={addTemplateId}
            onChange={(e) => setAddTemplateId(e.target.value)}
            className="rounded-xl border px-3 py-2 md:col-span-2 bg-white"
          >
            <option value="">Không dùng template</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({String(t.startTime).slice(0, 5)}-
                {String(t.endTime).slice(0, 5)})
              </option>
            ))}
          </select>

          <input
            type="number"
            value={addBreak}
            onChange={(e) => setAddBreak(Number(e.target.value))}
            className="rounded-xl border px-3 py-2"
            placeholder="Break"
            min={0}
          />

          {!addTemplateId && (
            <>
              <input
                type="time"
                value={addStart}
                onChange={(e) => setAddStart(e.target.value)}
                className="rounded-xl border px-3 py-2"
              />
              <input
                type="time"
                value={addEnd}
                onChange={(e) => setAddEnd(e.target.value)}
                className="rounded-xl border px-3 py-2"
              />
            </>
          )}
        </div>

        <div className="mt-3 flex justify-end">
          <button
            onClick={scheduleOne}
            disabled={!outletId || !addStaffId}
            className="rounded-xl bg-slate-900 text-white px-4 py-2 disabled:opacity-50"
          >
            + Xếp ca
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white border shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="font-semibold">Danh sách phân ca</div>
          <div className="text-sm text-slate-600">
            {loading ? "Đang tải..." : `${items.length} ca`}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full">
            <thead className="bg-slate-50">
              <tr className="text-left text-sm text-slate-600">
                <th className="px-4 py-3">Ngày</th>
                <th className="px-4 py-3">Nhân viên</th>
                <th className="px-4 py-3">Ca</th>
                <th className="px-4 py-3">Giờ</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="px-4 py-3">{a.workDate}</td>
                  <td className="px-4 py-3">{a.staffName ?? a.staffId}</td>
                  <td className="px-4 py-3">{a.workShiftName ?? "-"}</td>
                  <td className="px-4 py-3">
                    {String(a.startTime).slice(0, 5)} -{" "}
                    {String(a.endTime).slice(0, 5)}
                  </td>
                  <td className="px-4 py-3">{a.status}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(a)}
                        className="rounded-xl border px-3 py-2 hover:bg-slate-50"
                      >
                        Sửa
                      </button>

                      <button
                        onClick={() => askCancel(a)}
                        className="rounded-xl border border-rose-200 text-rose-700 px-3 py-2 hover:bg-rose-50 disabled:opacity-50"
                        disabled={a.status === "CANCELED"}
                        title={a.status === "CANCELED" ? "Đã hủy" : "Hủy ca"}
                      >
                        {a.status === "CANCELED" ? "Đã hủy" : "Hủy"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-slate-500"
                  >
                    Không có ca trong khoảng đã chọn
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!outletId && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-amber-800">
          Bạn chưa chọn outlet. Hãy chọn outlet ở sidebar/topbar để phân ca.
        </div>
      )}

      {/* Edit dialog */}
      <ShiftAssignmentDialog
        open={editOpen}
        initial={editTarget}
        staffOptions={staffOptions}
        templates={templates}
        onClose={() => {
          if (editSaving) return;
          setEditOpen(false);
          setEditTarget(null);
        }}
        onSubmit={submitEdit}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Hủy ca?"
        description={
          confirmTarget
            ? `${confirmTarget.workDate} - ${
                confirmTarget.staffName ?? confirmTarget.staffId
              }`
            : ""
        }
        confirmText="Hủy ca"
        danger
        loading={confirmLoading}
        onClose={() => {
          if (confirmLoading) return;
          setConfirmOpen(false);
          setConfirmTarget(null);
        }}
        onConfirm={doCancel}
      />
    </div>
  );
}
