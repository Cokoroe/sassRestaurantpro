import { useEffect, useMemo, useState } from "react";
import type {
  ShiftScheduleItem,
  ShiftScheduleRequest,
  ShiftTemplate,
} from "../../../types/shift";
import type { StaffOption } from "../../../types/staff";

type DraftRow = ShiftScheduleItem & { _key: string };

type Props = {
  open: boolean;
  ctxOutletId: string;
  staffOptions: StaffOption[];
  templates: ShiftTemplate[];
  onClose: () => void;
  onSubmit: (payload: ShiftScheduleRequest) => Promise<void>;
};

const genKey = () => Math.random().toString(16).slice(2);

export default function ShiftBulkScheduleDialog({
  open,
  ctxOutletId,
  staffOptions,
  templates,
  onClose,
  onSubmit,
}: Props) {
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    // init 1 dòng
    const firstStaff = staffOptions[0]?.id || "";
    setRows([
      {
        _key: genKey(),
        staffId: firstStaff,
        workDate: new Date().toISOString().slice(0, 10),
        workShiftId: templates[0]?.id || "",
        startTime: null,
        endTime: null,
        breakMinutes: null,
        note: "",
        status: "ASSIGNED",
      },
    ]);
  }, [open, staffOptions, templates]);

  const canSubmit = useMemo(() => {
    if (!ctxOutletId) return false;
    if (rows.length === 0) return false;

    for (const r of rows) {
      if (!r.staffId) return false;
      if (!r.workDate) return false;
      // nếu không chọn template thì bắt buộc start/end
      if (!r.workShiftId && (!r.startTime || !r.endTime)) return false;
    }
    return true;
  }, [ctxOutletId, rows]);

  const applyTemplateToRow = (key: string, templateId: string) => {
    const t = templates.find((x) => x.id === templateId);
    setRows((prev) =>
      prev.map((r) => {
        if (r._key !== key) return r;
        if (!t) return { ...r, workShiftId: templateId };
        // nếu dùng template thì không bắt buộc override time
        return {
          ...r,
          workShiftId: templateId,
          startTime: null,
          endTime: null,
          breakMinutes: r.breakMinutes ?? t.breakMinutes ?? 0,
        };
      })
    );
  };

  const addRow = () => {
    const firstStaff = staffOptions[0]?.id || "";
    setRows((prev) => [
      ...prev,
      {
        _key: genKey(),
        staffId: firstStaff,
        workDate: new Date().toISOString().slice(0, 10),
        workShiftId: templates[0]?.id || "",
        startTime: null,
        endTime: null,
        breakMinutes: null,
        note: "",
        status: "ASSIGNED",
      },
    ]);
  };

  const removeRow = (key: string) => {
    setRows((prev) => prev.filter((r) => r._key !== key));
  };

  const updateRow = (key: string, patch: Partial<DraftRow>) => {
    setRows((prev) =>
      prev.map((r) => (r._key === key ? { ...r, ...patch } : r))
    );
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSaving(true);
    try {
      const payload: ShiftScheduleRequest = {
        outletId: ctxOutletId,
        items: rows.map(({ _key, ...rest }) => ({
          ...rest,
          workShiftId: rest.workShiftId || null,
          startTime: rest.startTime || null,
          endTime: rest.endTime || null,
          breakMinutes: rest.breakMinutes ?? null,
          note: rest.note || null,
          status: rest.status || "ASSIGNED",
        })),
      };

      await onSubmit(payload);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-6xl rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="text-lg font-semibold">Xếp lịch (Bulk)</div>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1 hover:bg-slate-100"
          >
            Đóng
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div className="flex justify-between items-center">
            <div className="text-sm text-slate-600">
              Tạo nhiều ca một lần (POST /shifts/schedule)
            </div>
            <button
              onClick={addRow}
              className="rounded-xl border px-3 py-2 hover:bg-slate-50"
            >
              + Thêm dòng
            </button>
          </div>

          <div className="overflow-auto border rounded-2xl">
            <table className="min-w-[1100px] w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr className="text-left">
                  <th className="p-3">Nhân viên</th>
                  <th className="p-3">Ngày</th>
                  <th className="p-3">Template</th>
                  <th className="p-3">Start</th>
                  <th className="p-3">End</th>
                  <th className="p-3">Break</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Note</th>
                  <th className="p-3 text-right">#</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((r) => {
                  const isManual = !r.workShiftId;
                  return (
                    <tr key={r._key} className="border-t">
                      <td className="p-3">
                        <select
                          className="w-full border rounded-xl px-3 py-2 bg-white"
                          value={r.staffId}
                          onChange={(e) =>
                            updateRow(r._key, { staffId: e.target.value })
                          }
                        >
                          {staffOptions.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label ?? s.name ?? s.id}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="p-3">
                        <input
                          type="date"
                          className="w-full border rounded-xl px-3 py-2"
                          value={r.workDate}
                          onChange={(e) =>
                            updateRow(r._key, { workDate: e.target.value })
                          }
                        />
                      </td>

                      <td className="p-3">
                        <select
                          className="w-full border rounded-xl px-3 py-2 bg-white"
                          value={r.workShiftId || ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (!v) {
                              // manual
                              updateRow(r._key, {
                                workShiftId: "",
                                startTime: "09:00",
                                endTime: "18:00",
                              });
                            } else {
                              applyTemplateToRow(r._key, v);
                            }
                          }}
                        >
                          <option value="">-- Manual time --</option>
                          {templates.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} ({String(t.startTime).slice(0, 5)}-
                              {String(t.endTime).slice(0, 5)})
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="p-3">
                        <input
                          type="time"
                          className="w-full border rounded-xl px-3 py-2 disabled:bg-slate-50"
                          value={(r.startTime ?? "").toString().slice(0, 5)}
                          onChange={(e) =>
                            updateRow(r._key, { startTime: e.target.value })
                          }
                          disabled={!isManual}
                        />
                      </td>

                      <td className="p-3">
                        <input
                          type="time"
                          className="w-full border rounded-xl px-3 py-2 disabled:bg-slate-50"
                          value={(r.endTime ?? "").toString().slice(0, 5)}
                          onChange={(e) =>
                            updateRow(r._key, { endTime: e.target.value })
                          }
                          disabled={!isManual}
                        />
                      </td>

                      <td className="p-3">
                        <input
                          type="number"
                          min={0}
                          className="w-full border rounded-xl px-3 py-2"
                          value={r.breakMinutes ?? 0}
                          onChange={(e) =>
                            updateRow(r._key, {
                              breakMinutes: Number(e.target.value || 0),
                            })
                          }
                        />
                      </td>

                      <td className="p-3">
                        <select
                          className="w-full border rounded-xl px-3 py-2 bg-white"
                          value={r.status || "ASSIGNED"}
                          onChange={(e) =>
                            updateRow(r._key, { status: e.target.value })
                          }
                        >
                          <option value="ASSIGNED">ASSIGNED</option>
                          <option value="CANCELED">CANCELED</option>
                        </select>
                      </td>

                      <td className="p-3">
                        <input
                          className="w-full border rounded-xl px-3 py-2"
                          value={r.note ?? ""}
                          onChange={(e) =>
                            updateRow(r._key, { note: e.target.value })
                          }
                          placeholder="optional"
                        />
                      </td>

                      <td className="p-3 text-right">
                        <button
                          onClick={() => removeRow(r._key)}
                          className="rounded-xl border px-3 py-2 hover:bg-slate-50"
                          disabled={rows.length <= 1}
                          title={
                            rows.length <= 1 ? "Cần ít nhất 1 dòng" : "Xoá dòng"
                          }
                        >
                          Xoá
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!canSubmit && (
            <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              Vui lòng chọn staff + ngày. Nếu không chọn template thì phải nhập
              start/end.
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 hover:bg-slate-100"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || saving}
            className="rounded-xl px-4 py-2 bg-slate-900 text-white disabled:opacity-50"
          >
            {saving ? "Đang lưu..." : "Xếp lịch"}
          </button>
        </div>
      </div>
    </div>
  );
}
