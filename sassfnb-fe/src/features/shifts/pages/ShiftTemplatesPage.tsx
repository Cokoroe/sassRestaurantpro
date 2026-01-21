import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { AppLayoutContext } from "../../../layout/AppLayout";
import { shiftService } from "../../../api/services/shift.service";
import { useShiftTemplates } from "../hooks/useShiftTemplates";
import ShiftTemplateDialog from "../components/ShiftTemplateDialog";
import ConfirmDialog from "../components/ConfirmDialog";
import { ShiftToast, type ShiftToastState } from "../components/ShiftToast";
import type { ShiftTemplate } from "../../../types/shift";

export default function ShiftTemplatesPage() {
  const { setTitle } = useOutletContext<AppLayoutContext>();
  useMemo(() => setTitle?.("Ca mẫu (Shift Templates)"), [setTitle]);

  const { outletId, loading, rows, refresh } = useShiftTemplates();
  const ctxReady = !!outletId;

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<ShiftTemplate | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<ShiftTemplate | null>(
    null
  );

  const [toast, setToast] = useState<ShiftToastState>({
    open: false,
    kind: "info",
    message: "",
  });

  const openCreate = () => {
    setFormMode("create");
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (t: ShiftTemplate) => {
    setFormMode("edit");
    setEditing(t);
    setFormOpen(true);
  };

  const askDelete = (t: ShiftTemplate) => {
    setConfirmTarget(t);
    setConfirmOpen(true);
  };

  const doDelete = async () => {
    if (!confirmTarget) return;
    setConfirmLoading(true);
    try {
      await shiftService.deleteTemplate(confirmTarget.id); // BE soft delete isActive=false
      setToast({
        open: true,
        kind: "success",
        message: "Đã xoá (soft) ca mẫu.",
      });
      setConfirmOpen(false);
      setConfirmTarget(null);
      await refresh();
    } catch (e: any) {
      setToast({
        open: true,
        kind: "error",
        message: e?.message || "Không thể xoá template.",
      });
    } finally {
      setConfirmLoading(false);
    }
  };

  const onSubmit = async (payload: any) => {
    try {
      if (formMode === "create") {
        await shiftService.createTemplate(payload);
        setToast({ open: true, kind: "success", message: "Đã tạo ca mẫu." });
      } else if (editing) {
        await shiftService.updateTemplate(editing.id, payload);
        setToast({
          open: true,
          kind: "success",
          message: "Đã cập nhật ca mẫu.",
        });
      }
      await refresh();
    } catch (e: any) {
      setToast({
        open: true,
        kind: "error",
        message: e?.message || "Không thể lưu template.",
      });
      throw e;
    }
  };

  return (
    <div className="space-y-4">
      <ShiftToast
        state={toast}
        onClose={() => setToast((s) => ({ ...s, open: false }))}
      />

      <div className="p-4 rounded-2xl border bg-white flex items-center justify-between gap-3">
        <div>
          <div className="font-semibold">Templates</div>
          <div className="text-sm text-slate-600">
            Quản lý work_shifts theo outlet hiện tại
          </div>
        </div>
        <button
          className="px-4 py-2 rounded-xl bg-slate-900 text-white disabled:opacity-50"
          onClick={openCreate}
          disabled={!ctxReady}
          title={!ctxReady ? "Cần chọn Outlet trước" : ""}
        >
          + Tạo template
        </button>
      </div>

      {!ctxReady && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-amber-800 text-sm">
          Bạn chưa chọn Outlet. Hãy chọn ở sidebar/topbar trước.
        </div>
      )}

      <div className="rounded-2xl border bg-white overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="font-semibold">Danh sách</div>
          <div className="text-sm text-slate-600">
            {loading ? "Đang tải..." : `${rows.length} template`}
          </div>
        </div>

        <div className="overflow-auto">
          <table className="min-w-[1100px] w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr className="text-left">
                <th className="p-3">Name</th>
                <th className="p-3">Time</th>
                <th className="p-3">Break</th>
                <th className="p-3">Role required</th>
                <th className="p-3">Active</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="p-3 font-medium">{t.name}</td>
                  <td className="p-3">
                    {String(t.startTime).slice(0, 5)} -{" "}
                    {String(t.endTime).slice(0, 5)}
                  </td>
                  <td className="p-3">{t.breakMinutes ?? 0}</td>
                  <td className="p-3">{t.roleRequired ?? "-"}</td>
                  <td className="p-3">{t.isActive ? "YES" : "NO"}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(t)}
                        className="rounded-xl border px-3 py-2 hover:bg-slate-50"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => askDelete(t)}
                        className="rounded-xl border border-rose-200 text-rose-700 px-3 py-2 hover:bg-rose-50"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {rows.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    Chưa có template
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ShiftTemplateDialog
        open={formOpen}
        mode={formMode}
        initial={editing}
        ctxOutletId={outletId}
        onClose={() => setFormOpen(false)}
        onSubmit={onSubmit}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Xóa template?"
        description={
          confirmTarget
            ? `Template "${confirmTarget.name}" sẽ bị soft-delete (isActive=false).`
            : ""
        }
        confirmText="Xóa"
        danger
        loading={confirmLoading}
        onClose={() => {
          if (confirmLoading) return;
          setConfirmOpen(false);
          setConfirmTarget(null);
        }}
        onConfirm={doDelete}
      />
    </div>
  );
}
