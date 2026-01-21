import { useEffect, useMemo, useState } from "react";
import type {
  ShiftAssignment,
  ShiftTemplate,
  ShiftUpdateRequest,
} from "../../../types/shift";
import type { StaffOption } from "../../../types/staff";

type Props = {
  open: boolean;
  initial?: ShiftAssignment | null;

  staffOptions: StaffOption[];
  templates: ShiftTemplate[];

  onClose: () => void;
  onSubmit: (payload: ShiftUpdateRequest) => Promise<void>;
};

const toHHmm = (v?: string | null) => (v ? String(v).slice(0, 5) : "09:00");
const toHHmmss = (v: string) => (v?.length === 5 ? `${v}:00` : v);

export default function ShiftAssignmentDialog({
  open,
  initial,
  staffOptions,
  templates,
  onClose,
  onSubmit,
}: Props) {
  const [staffId, setStaffId] = useState("");
  const [workShiftId, setWorkShiftId] = useState<string>("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [breakMinutes, setBreakMinutes] = useState<number>(0);
  const [status, setStatus] = useState("ASSIGNED");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !initial) return;

    setStaffId(initial.staffId);
    setWorkShiftId(initial.workShiftId ?? "");
    setStartTime(toHHmm(initial.startTime));
    setEndTime(toHHmm(initial.endTime));
    setBreakMinutes(Number(initial.breakMinutes ?? 0));
    setStatus(initial.status ?? "ASSIGNED");
    setNote(initial.note ?? "");
  }, [open, initial]);

  const canSubmit = useMemo(() => {
    if (!staffId) return false;
    if (!startTime || !endTime) return false;
    return true;
  }, [staffId, startTime, endTime]);

  const applyTemplate = (id: string) => {
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    setStartTime(toHHmm(t.startTime));
    setEndTime(toHHmm(t.endTime));
    setBreakMinutes(Number(t.breakMinutes ?? 0));
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const payload: ShiftUpdateRequest = {
        staffId,
        workShiftId: workShiftId || null,
        startTime: toHHmmss(startTime),
        endTime: toHHmmss(endTime),
        breakMinutes,
        status: status || null,
        note: note?.trim() ? note.trim() : null,
      };
      await onSubmit(payload);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open || !initial) return null;

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="text-lg font-semibold">
            Sửa ca ({initial.workDate})
          </div>
          <button
            onClick={() => !saving && onClose()}
            className="rounded-lg px-3 py-1 hover:bg-slate-100"
          >
            Đóng
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Nhân viên</label>
            <select
              className="mt-1 w-full rounded-xl border px-3 py-2 bg-white"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
            >
              {staffOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label ?? s.name ?? s.id}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium">Ca mẫu (optional)</label>
            <select
              className="mt-1 w-full rounded-xl border px-3 py-2 bg-white"
              value={workShiftId}
              onChange={(e) => {
                setWorkShiftId(e.target.value);
                if (e.target.value) applyTemplate(e.target.value);
              }}
            >
              <option value="">-- Không dùng template --</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({String(t.startTime).slice(0, 5)} -{" "}
                  {String(t.endTime).slice(0, 5)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Bắt đầu</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Kết thúc</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Nghỉ (phút)</label>
            <input
              type="number"
              min={0}
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(Number(e.target.value || 0))}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Trạng thái</label>
            <select
              className="mt-1 w-full rounded-xl border px-3 py-2 bg-white"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="CANCELED">CANCELED</option>
              <option value="CLOSED">CLOSED</option>
              <option value="DONE">DONE</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium">Ghi chú</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2"
              rows={3}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t">
          <button
            onClick={() => !saving && onClose()}
            className="rounded-xl px-4 py-2 hover:bg-slate-100"
          >
            Hủy
          </button>
          <button
            disabled={!canSubmit || saving}
            onClick={handleSubmit}
            className="rounded-xl px-4 py-2 bg-slate-900 text-white disabled:opacity-50"
          >
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}
