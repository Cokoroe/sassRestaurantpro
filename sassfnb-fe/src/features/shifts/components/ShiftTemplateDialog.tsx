import { useEffect, useMemo, useState } from "react";
import type {
  ShiftTemplate,
  ShiftTemplateCreateRequest,
  ShiftTemplateUpdateRequest,
} from "../../../types/shift";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  initial?: ShiftTemplate | null;
  ctxOutletId?: string | null;
  onClose: () => void;
  onSubmit: (
    payload: ShiftTemplateCreateRequest | ShiftTemplateUpdateRequest
  ) => Promise<void>;
};

const toHHmm = (v?: string | null) => (v ? String(v).slice(0, 5) : "09:00");
const toHHmmss = (v: string) => (v?.length === 5 ? `${v}:00` : v);

export default function ShiftTemplateDialog({
  open,
  mode,
  initial,
  ctxOutletId,
  onClose,
  onSubmit,
}: Props) {
  const isEdit = mode === "edit";

  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [breakMinutes, setBreakMinutes] = useState<number>(0);
  const [roleRequired, setRoleRequired] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [status, setStatus] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (isEdit && initial) {
      setName(initial.name ?? "");
      setStartTime(toHHmm(initial.startTime));
      setEndTime(toHHmm(initial.endTime));
      setBreakMinutes(Number(initial.breakMinutes ?? 0));
      setRoleRequired(initial.roleRequired ?? "");
      setIsActive(Boolean(initial.isActive ?? true));
      setStatus(initial.status ?? "");
      return;
    }

    // create mode
    setName("");
    setStartTime("09:00");
    setEndTime("18:00");
    setBreakMinutes(0);
    setRoleRequired("");
    setIsActive(true);
    setStatus("");
  }, [open, isEdit, initial]);

  const canSubmit = useMemo(() => {
    // create cần outletId, edit không cần
    if (!isEdit && !ctxOutletId) return false;
    if (!name.trim()) return false;
    if (!startTime || !endTime) return false;
    return true;
  }, [isEdit, ctxOutletId, name, startTime, endTime]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      if (isEdit) {
        const payload: ShiftTemplateUpdateRequest = {
          name: name.trim(),
          startTime: toHHmmss(startTime),
          endTime: toHHmmss(endTime),
          breakMinutes,
          roleRequired: roleRequired?.trim() ? roleRequired.trim() : null,
          isActive,
          status: status?.trim() ? status.trim() : null,
        };
        await onSubmit(payload);
      } else {
        const payload: ShiftTemplateCreateRequest = {
          outletId: ctxOutletId!,
          name: name.trim(),
          startTime: toHHmmss(startTime),
          endTime: toHHmmss(endTime),
          breakMinutes,
          roleRequired: roleRequired?.trim() ? roleRequired.trim() : null,
          isActive,
          status: status?.trim() ? status.trim() : null,
        };
        await onSubmit(payload);
      }

      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="text-lg font-semibold">
            {isEdit ? "Cập nhật ca mẫu" : "Tạo ca mẫu"}
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
            <label className="text-sm font-medium">Tên ca</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2"
              placeholder="Morning / Night / Part-time..."
            />
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
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(Number(e.target.value || 0))}
              className="mt-1 w-full rounded-xl border px-3 py-2"
              min={0}
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Role required (optional)
            </label>
            <input
              value={roleRequired}
              onChange={(e) => setRoleRequired(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2"
              placeholder="WAITER / CASHIER..."
            />
          </div>

          <div>
            <label className="text-sm font-medium">Status (optional)</label>
            <input
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2"
              placeholder="OPEN/CLOSED..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isActive"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <label htmlFor="isActive" className="text-sm font-medium">
              Active
            </label>
          </div>

          {!isEdit && !ctxOutletId && (
            <div className="md:col-span-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-amber-800 text-sm">
              Bạn chưa chọn outlet. Hãy chọn outlet ở sidebar/topbar trước khi
              tạo ca mẫu.
            </div>
          )}
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
