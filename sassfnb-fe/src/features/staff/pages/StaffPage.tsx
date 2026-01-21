import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { AppLayoutContext } from "../../../layout/AppLayout";
import { staffService } from "../../../api/services/staff.service";
import type {
  Staff,
  StaffCreateRequest,
  StaffUpdateRequest,
  StaffStatus,
} from "../../../types/staff";
import { useStaffs } from "../hooks/useStaffs";
import StaffFormDialog from "../components/StaffFormDialog";
import StaffRolesDialog from "../components/StaffRolesDialog";
import ConfirmDialog from "../components/ConfirmDialog";
import { StaffToast, type StaffToastState } from "../components/StaffToast";

function StatusPill({ status }: { status: StaffStatus }) {
  const cls =
    status === "ACTIVE"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-slate-50 text-slate-700 border-slate-200";
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-lg border ${cls}`}
    >
      {status}
    </span>
  );
}

export default function StaffPage() {
  const { setTitle } = useOutletContext<AppLayoutContext>();
  useMemo(() => setTitle?.("Quản lý nhân sự"), [setTitle]);

  const {
    loading,
    rows,
    totalElements,
    totalPages,
    page,
    setPage,
    size,
    setSize,
    q,
    setQ,
    status,
    setStatus,
    applyFilters,
    refresh,
    outletId,
    restaurantId,
  } = useStaffs();

  const ctxReady = !!restaurantId && !!outletId;

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<Staff | null>(null);

  // ✅ Role dialog
  const [roleOpen, setRoleOpen] = useState(false);
  const [roleUserId, setRoleUserId] = useState<string>("");
  const [roleStaffLabel, setRoleStaffLabel] = useState<string>("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Staff | null>(null);
  const [confirmKind, setConfirmKind] = useState<"delete" | "toggleStatus">(
    "delete",
  );

  const [toast, setToast] = useState<StaffToastState>({
    open: false,
    kind: "info",
    message: "",
  });

  const openCreate = () => {
    setFormMode("create");
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (s: Staff) => {
    setFormMode("edit");
    setEditing(s);
    setFormOpen(true);
  };

  const openRole = (s: Staff) => {
    if (!ctxReady) return;

    // ✅ yêu cầu staff phải có userId
    const userId = (s as any).userId as string | undefined;
    if (!userId) {
      setToast({
        open: true,
        kind: "error",
        message: "Staff này chưa có userId nên không thể gán role.",
      });
      return;
    }

    setRoleUserId(userId);
    setRoleStaffLabel(s.fullName || s.email || s.code || "Nhân viên");
    setRoleOpen(true);
  };

  const onSubmitForm = async (
    payload: StaffCreateRequest | StaffUpdateRequest,
  ) => {
    try {
      if (formMode === "create") {
        await staffService.create(payload as StaffCreateRequest);
        setToast({ open: true, kind: "success", message: "Đã tạo nhân viên." });
      } else if (editing) {
        await staffService.update(editing.id, payload as StaffUpdateRequest);
        setToast({
          open: true,
          kind: "success",
          message: "Đã cập nhật nhân viên.",
        });
      }
      await refresh();
    } catch (e: any) {
      setToast({
        open: true,
        kind: "error",
        message: e?.message || "Không thể lưu nhân viên.",
      });
      throw e;
    }
  };

  const askDelete = (s: Staff) => {
    setConfirmKind("delete");
    setConfirmTarget(s);
    setConfirmOpen(true);
  };

  const askToggleStatus = (s: Staff) => {
    setConfirmKind("toggleStatus");
    setConfirmTarget(s);
    setConfirmOpen(true);
  };

  const doConfirm = async () => {
    if (!confirmTarget) return;
    setConfirmLoading(true);
    try {
      if (confirmKind === "delete") {
        await staffService.remove(confirmTarget.id);
        setToast({
          open: true,
          kind: "success",
          message: "Đã xoá (INACTIVE) nhân viên.",
        });
      } else {
        const next: StaffStatus =
          confirmTarget.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        await staffService.updateStatus(confirmTarget.id, { status: next });
        setToast({
          open: true,
          kind: "success",
          message: `Đã cập nhật trạng thái: ${next}`,
        });
      }
      setConfirmOpen(false);
      setConfirmTarget(null);
      await refresh();
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
      <StaffToast
        state={toast}
        onClose={() => setToast((s) => ({ ...s, open: false }))}
      />

      {/* Filters */}
      <div className="p-4 rounded-2xl border bg-white">
        <div className="flex flex-col md:flex-row gap-3 md:items-end">
          <div className="flex-1">
            <label className="text-sm text-gray-600">Tìm kiếm</label>
            <input
              className="w-full border rounded-xl px-3 py-2"
              placeholder="code / position"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyFilters();
              }}
            />
          </div>

          <div className="w-full md:w-60">
            <label className="text-sm text-gray-600">Trạng thái</label>
            <select
              className="w-full border rounded-xl px-3 py-2"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <option value="">Tất cả</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          <button
            className="px-4 py-2 rounded-xl bg-slate-900 text-white disabled:opacity-50"
            onClick={applyFilters}
            disabled={loading}
          >
            Tìm
          </button>

          <button
            className="px-4 py-2 rounded-xl border hover:bg-slate-50 disabled:opacity-50"
            onClick={openCreate}
            disabled={!ctxReady}
            title={!ctxReady ? "Cần chọn restaurant & outlet trước" : ""}
          >
            + Tạo nhân viên
          </button>
        </div>

        {!ctxReady && (
          <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-amber-800 text-sm">
            Bạn chưa chọn <b>Restaurant</b> hoặc <b>Outlet</b>. Hãy chọn ở
            sidebar/topbar trước khi tạo nhân viên.
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border bg-white overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="font-semibold">Danh sách nhân viên</div>
          <div className="text-sm text-slate-600">
            {loading ? "Đang tải..." : `${totalElements} nhân viên`}
          </div>
        </div>

        <div className="overflow-auto">
          <table className="min-w-[1100px] w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-slate-600">
                <th className="p-3">Code</th>
                <th className="p-3">Họ tên</th>
                <th className="p-3">Email</th>
                <th className="p-3">SĐT</th>
                <th className="p-3">Vị trí</th>
                <th className="p-3">Status</th>
                <th className="p-3">Hired</th>
                <th className="p-3 text-right">Hành động</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="p-3">{s.code ?? "-"}</td>
                  <td className="p-3">{s.fullName ?? "-"}</td>
                  <td className="p-3">{s.email ?? "-"}</td>
                  <td className="p-3">{s.phone ?? "-"}</td>
                  <td className="p-3">{s.position ?? "-"}</td>
                  <td className="p-3">
                    <StatusPill status={s.status} />
                  </td>
                  <td className="p-3">{s.hiredDate ?? "-"}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      {/* ✅ NEW: Role */}
                      <button
                        onClick={() => openRole(s)}
                        className="rounded-xl border px-3 py-2 hover:bg-slate-50 disabled:opacity-50"
                        disabled={!ctxReady}
                        title={
                          !ctxReady ? "Cần chọn restaurant & outlet trước" : ""
                        }
                      >
                        Role
                      </button>

                      <button
                        onClick={() => openEdit(s)}
                        className="rounded-xl border px-3 py-2 hover:bg-slate-50"
                      >
                        Sửa
                      </button>

                      <button
                        onClick={() => askToggleStatus(s)}
                        className="rounded-xl border px-3 py-2 hover:bg-slate-50"
                      >
                        {s.status === "ACTIVE" ? "Vô hiệu" : "Kích hoạt"}
                      </button>

                      <button
                        onClick={() => askDelete(s)}
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
                  <td className="p-6 text-center text-slate-500" colSpan={8}>
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <div className="text-sm text-slate-600">
            Trang {page + 1}/{totalPages}
          </div>

          <div className="flex items-center gap-2">
            <select
              className="rounded-xl border px-3 py-2"
              value={size}
              onChange={(e) => {
                setSize(Number(e.target.value));
                setPage(0);
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>

            <button
              className="rounded-xl border px-3 py-2 hover:bg-slate-50 disabled:opacity-50"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page <= 0 || loading}
            >
              Trước
            </button>

            <button
              className="rounded-xl border px-3 py-2 hover:bg-slate-50 disabled:opacity-50"
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1 || loading}
            >
              Sau
            </button>

            <button
              className="rounded-xl border px-3 py-2 hover:bg-slate-50 disabled:opacity-50"
              onClick={refresh}
              disabled={loading}
            >
              Làm mới
            </button>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <StaffFormDialog
        open={formOpen}
        mode={formMode}
        initial={editing}
        onClose={() => setFormOpen(false)}
        ctxRestaurantId={restaurantId}
        ctxOutletId={outletId}
        onSuccess={async () => {
          await refresh();
        }}
        onToast={(kind, message) => {
          setToast({ open: true, kind, message });
        }}
      />

      {/* ✅ NEW: Role dialog */}
      {ctxReady && roleUserId && (
        <StaffRolesDialog
          open={roleOpen}
          onClose={() => setRoleOpen(false)}
          userId={roleUserId}
          ctxRestaurantId={restaurantId!}
          ctxOutletId={outletId!}
          staffLabel={roleStaffLabel}
        />
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={
          confirmKind === "delete"
            ? "Xóa nhân viên?"
            : "Đổi trạng thái nhân viên?"
        }
        description={
          confirmTarget
            ? confirmKind === "delete"
              ? `Nhân viên "${
                  confirmTarget.fullName ??
                  confirmTarget.email ??
                  confirmTarget.id
                }" sẽ bị chuyển INACTIVE (soft delete).`
              : `Bạn muốn ${
                  confirmTarget.status === "ACTIVE" ? "vô hiệu" : "kích hoạt"
                } nhân viên "${
                  confirmTarget.fullName ??
                  confirmTarget.email ??
                  confirmTarget.id
                }"?`
            : ""
        }
        confirmText={confirmKind === "delete" ? "Xóa" : "Xác nhận"}
        danger={confirmKind === "delete"}
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
