import { useEffect, useMemo, useState } from "react";
import { rbacService } from "../../../api/services/rbac.service";
import type { RbacRole, UserRole } from "../../../types/rbac";

type Props = {
  open: boolean;
  onClose: () => void;

  userId: string; // staff.userId
  ctxRestaurantId: string;
  ctxOutletId: string;

  staffLabel?: string;
};

export default function StaffRolesDialog({
  open,
  onClose,
  userId,
  ctxRestaurantId,
  ctxOutletId,
  staffLabel,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<RbacRole[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [rs, urs] = await Promise.all([
        rbacService.listRoles(),
        rbacService.listUserRoles({
          userId,
          restaurantId: ctxRestaurantId,
          outletId: ctxOutletId,
        }),
      ]);
      setRoles(rs ?? []);
      setUserRoles(urs ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId, ctxRestaurantId, ctxOutletId]);

  const assignedRoleIds = useMemo(
    () => new Set(userRoles.map((x) => x.roleId)),
    [userRoles],
  );

  const availableRoles = useMemo(() => {
    return roles.filter((r) => !assignedRoleIds.has(r.id));
  }, [roles, assignedRoleIds]);

  const handleAssign = async () => {
    if (!selectedRoleId) return;
    setLoading(true);
    try {
      await rbacService.assignUserRole({
        userId,
        roleId: selectedRoleId,
        restaurantId: ctxRestaurantId,
        outletId: ctxOutletId,
      });
      setSelectedRoleId("");
      await fetchAll();
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userRoleId: string) => {
    // không cho xoá role cuối cùng để tránh user bị rỗng quyền
    if (userRoles.length <= 1) return;

    setLoading(true);
    try {
      await rbacService.unassignUserRole(userRoleId);
      await fetchAll();
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <div className="text-lg font-semibold">Quản lý role</div>
            <div className="text-xs text-slate-500">
              {staffLabel ? `Nhân viên: ${staffLabel}` : " "}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1 hover:bg-slate-100"
          >
            Đóng
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="rounded-xl border p-4 bg-slate-50">
            <div className="font-semibold mb-2">Thêm role</div>
            <div className="flex flex-col md:flex-row gap-2 md:items-center">
              <select
                className="flex-1 border rounded-xl px-3 py-2 bg-white"
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                disabled={loading}
              >
                <option value="">-- Chọn role --</option>
                {availableRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.code} {r.name ? `- ${r.name}` : ""}
                  </option>
                ))}
              </select>

              <button
                className="px-4 py-2 rounded-xl bg-slate-900 text-white disabled:opacity-50"
                onClick={handleAssign}
                disabled={loading || !selectedRoleId}
              >
                + Thêm
              </button>
            </div>

            {availableRoles.length === 0 && (
              <div className="text-xs text-slate-500 mt-2">
                Nhân viên đã có đủ role khả dụng trong outlet hiện tại.
              </div>
            )}
          </div>

          <div className="rounded-xl border overflow-hidden">
            <div className="px-4 py-3 border-b font-semibold">
              Role hiện tại
            </div>

            <div className="divide-y">
              {userRoles.map((ur) => (
                <div
                  key={ur.id}
                  className="px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-semibold">
                      {ur.roleCode ?? "ROLE"}{" "}
                      {ur.roleName ? `- ${ur.roleName}` : ""}
                    </div>
                    <div className="text-xs text-slate-500">
                      Outlet: {ctxOutletId.slice(0, 8)}...
                    </div>
                  </div>

                  <button
                    className="px-3 py-1.5 rounded-lg border hover:bg-slate-50 disabled:opacity-50"
                    onClick={() => handleRemove(ur.id)}
                    disabled={loading || userRoles.length <= 1}
                    title={
                      userRoles.length <= 1
                        ? "Không thể xoá role cuối cùng"
                        : "Gỡ role"
                    }
                  >
                    Gỡ
                  </button>
                </div>
              ))}

              {userRoles.length === 0 && (
                <div className="px-4 py-4 text-sm text-slate-500">
                  Chưa có role nào.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 hover:bg-slate-100"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
