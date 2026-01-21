import { useEffect, useMemo, useState } from "react";
import { shiftService } from "../../../api/services/shift.service";
import type {
  ShiftTemplate,
  ShiftTemplateCreateRequest,
  ShiftTemplateUpdateRequest,
} from "../../../types/shift";
import { useAppContextStore } from "../../../store/useAppContextStore";
import ConfirmDialog from "../components/ConfirmDialog";
import { ShiftToast, type ShiftToastState } from "../components/ShiftToast";
import ShiftTemplateDialog from "../components/ShiftTemplateDialog";

const getOutletId = (s: any) =>
  s.currentOutletId ||
  s.outletId ||
  s.selectedOutletId ||
  s.currentOutlet?.id ||
  s.outlet?.id ||
  null;

const toHHmmss = (v: string) => (v?.length === 5 ? `${v}:00` : v);

export default function TemplatesPanel() {
  const outletId = useAppContextStore((s) => getOutletId(s as any)) as
    | string
    | null;

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ShiftTemplate[]>([]);

  // create form
  const [name, setName] = useState("");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("18:00");
  const [breakMin, setBreakMin] = useState(0);

  const [toast, setToast] = useState<ShiftToastState>({
    open: false,
    kind: "info",
    message: "",
  });

  // confirm for toggle/delete
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<ShiftTemplate | null>(
    null
  );
  const [confirmMode, setConfirmMode] = useState<"toggle" | "delete">("delete");

  // edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ShiftTemplate | null>(null);

  const ctxReady = !!outletId;

  const fetchList = async () => {
    if (!outletId) return;
    setLoading(true);
    try {
      const res = await shiftService.listTemplates({ outletId });
      setItems(res ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outletId]);

  const canCreate = useMemo(
    () => !!outletId && !!name.trim(),
    [outletId, name]
  );

  const create = async () => {
    if (!canCreate) return;
    try {
      const payload: ShiftTemplateCreateRequest = {
        outletId: outletId ?? undefined,
        name: name.trim(),
        startTime: toHHmmss(start),
        endTime: toHHmmss(end),
        breakMinutes: breakMin,
        isActive: true,
      };
      await shiftService.createTemplate(payload);

      setName("");
      setToast({ open: true, kind: "success", message: "Đã tạo ca mẫu." });
      await fetchList();
    } catch (e: any) {
      setToast({
        open: true,
        kind: "error",
        message: e?.message || "Không thể tạo ca mẫu.",
      });
    }
  };

  const openEdit = (t: ShiftTemplate) => {
    setEditTarget(t);
    setEditOpen(true);
  };

  const submitEdit = async (
    payload: ShiftTemplateCreateRequest | ShiftTemplateUpdateRequest
  ) => {
    if (!editTarget) return;
    try {
      await shiftService.updateTemplate(
        editTarget.id,
        payload as ShiftTemplateUpdateRequest
      );
      setToast({ open: true, kind: "success", message: "Đã cập nhật ca mẫu." });
      await fetchList();
    } catch (e: any) {
      setToast({
        open: true,
        kind: "error",
        message: e?.message || "Không thể cập nhật ca mẫu.",
      });
      throw e;
    } finally {
      setEditOpen(false);
      setEditTarget(null);
    }
  };

  const askToggle = (t: ShiftTemplate) => {
    setConfirmMode("toggle");
    setConfirmTarget(t);
    setConfirmOpen(true);
  };

  const askDelete = (t: ShiftTemplate) => {
    setConfirmMode("delete");
    setConfirmTarget(t);
    setConfirmOpen(true);
  };

  const doConfirm = async () => {
    if (!confirmTarget) return;
    setConfirmLoading(true);
    try {
      if (confirmMode === "toggle") {
        await shiftService.updateTemplate(confirmTarget.id, {
          isActive: !(confirmTarget.isActive ?? true),
        });
        setToast({
          open: true,
          kind: "success",
          message: `Đã cập nhật Active: ${
            !(confirmTarget.isActive ?? true) ? "YES" : "NO"
          }`,
        });
      } else {
        await shiftService.deleteTemplate(confirmTarget.id);
        setToast({
          open: true,
          kind: "success",
          message: "Đã tắt (soft-delete) ca mẫu.",
        });
      }

      setConfirmOpen(false);
      setConfirmTarget(null);
      await fetchList();
    } catch (e: any) {
      setToast({
        open: true,
        kind: "error",
        message: e?.message || "Không thể thực hiện thao tác.",
      });
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <ShiftToast
        state={toast}
        onClose={() => setToast((s) => ({ ...s, open: false }))}
      />

      <div className="rounded-2xl bg-white border p-4 shadow-sm">
        <div className="text-lg font-semibold mb-3">Tạo ca mẫu</div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl border px-3 py-2"
            placeholder="Tên ca (VD: Ca sáng)"
          />
          <input
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="rounded-xl border px-3 py-2"
          />
          <input
            type="time"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="rounded-xl border px-3 py-2"
          />
          <input
            type="number"
            value={breakMin}
            onChange={(e) => setBreakMin(Number(e.target.value))}
            className="rounded-xl border px-3 py-2"
            placeholder="Break (phút)"
            min={0}
          />
        </div>

        <div className="mt-3 flex justify-end gap-2">
          <button
            onClick={fetchList}
            className="rounded-xl border px-4 py-2 hover:bg-slate-50"
          >
            Làm mới
          </button>
          <button
            disabled={!canCreate}
            onClick={create}
            className="rounded-xl bg-slate-900 text-white px-4 py-2 disabled:opacity-50"
          >
            + Tạo ca
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white border shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="font-semibold">Danh sách ca mẫu</div>
          <div className="text-sm text-slate-600">
            {loading ? "Đang tải..." : `${items.length} ca`}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full">
            <thead className="bg-slate-50">
              <tr className="text-left text-sm text-slate-600">
                <th className="px-4 py-3">Tên</th>
                <th className="px-4 py-3">Giờ</th>
                <th className="px-4 py-3">Break</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3">
                    {String(t.startTime).slice(0, 5)} -{" "}
                    {String(t.endTime).slice(0, 5)}
                  </td>
                  <td className="px-4 py-3">{t.breakMinutes ?? 0} phút</td>
                  <td className="px-4 py-3">{t.isActive ? "YES" : "NO"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(t)}
                        className="rounded-xl border px-3 py-2 hover:bg-slate-50"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => askToggle(t)}
                        className="rounded-xl border px-3 py-2 hover:bg-slate-50"
                      >
                        Toggle
                      </button>
                      <button
                        onClick={() => askDelete(t)}
                        className="rounded-xl border border-rose-200 text-rose-700 px-3 py-2 hover:bg-rose-50"
                      >
                        Tắt
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {items.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-slate-500"
                  >
                    Chưa có ca mẫu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!ctxReady && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-amber-800">
          Bạn chưa chọn outlet. Hãy chọn outlet ở sidebar/topbar để quản lý ca.
        </div>
      )}

      {/* Edit Dialog */}
      <ShiftTemplateDialog
        open={editOpen}
        mode="edit"
        initial={editTarget}
        ctxOutletId={outletId}
        onClose={() => {
          setEditOpen(false);
          setEditTarget(null);
        }}
        onSubmit={submitEdit}
      />

      <ConfirmDialog
        open={confirmOpen}
        title={
          confirmMode === "toggle" ? "Đổi trạng thái Active?" : "Tắt ca mẫu?"
        }
        description={
          confirmTarget
            ? confirmMode === "toggle"
              ? `Ca "${confirmTarget.name}" sẽ đổi Active (YES/NO).`
              : `Ca "${confirmTarget.name}" sẽ bị soft-delete (isActive=false).`
            : ""
        }
        confirmText={confirmMode === "toggle" ? "Cập nhật" : "Tắt"}
        danger={confirmMode === "delete"}
        loading={confirmLoading}
        onClose={() => {
          if (confirmLoading) return;
          setConfirmOpen(false);
          setConfirmTarget(null);
        }}
        onConfirm={doConfirm}
      />
    </div>
  );
}
