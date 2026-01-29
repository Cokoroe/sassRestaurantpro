// src/features/staff/components/StaffFormDialog.tsx
import { useEffect, useMemo, useState } from "react";
import type {
  Staff,
  StaffCreateRequest,
  StaffUpdateRequest,
} from "../../../types/staff";
import { staffService } from "../../../api/services/staff.service";
import { rbacService } from "../../../api/services/rbac.service";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  initial?: Staff | null;
  onClose: () => void;

  onSubmit?: (
    payload: StaffCreateRequest | StaffUpdateRequest,
  ) => Promise<void>;

  ctxRestaurantId?: string | null;
  ctxOutletId?: string | null;

  onSuccess?: () => Promise<void> | void;
  onToast?: (kind: "success" | "error" | "info", message: string) => void;
};

export default function StaffFormDialog({
  open,
  mode,
  initial,
  onClose,
  ctxRestaurantId,
  ctxOutletId,
  onSuccess,
  onToast,
}: Props) {
  const isEdit = mode === "edit";

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [position, setPosition] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [hiredDate, setHiredDate] = useState<string>("");
  const [terminatedDate, setTerminatedDate] = useState<string>("");

  // avatar
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");

  // submit state
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // ✅ NEW: WAITER role
  const [waiterRoleId, setWaiterRoleId] = useState<string>("");
  const [roleLoading, setRoleLoading] = useState(false);

  /* =======================
   * Init form
   * ======================= */
  useEffect(() => {
    if (!open) return;

    if (isEdit && initial) {
      setEmail(initial.email ?? "");
      setFullName(initial.fullName ?? "");
      setPhone(initial.phone ?? "");
      setCode(initial.code ?? "");
      setPosition(initial.position ?? "");
      setAvatarUrl(initial.avatarUrl ?? "");
      setHiredDate(initial.hiredDate ?? "");
      setTerminatedDate(initial.terminatedDate ?? "");
      setAvatarFile(null);
      setAvatarPreview("");
      return;
    }

    // create
    setEmail("");
    setFullName("");
    setPhone("");
    setCode("");
    setPosition("");
    setAvatarUrl("");
    setHiredDate("");
    setTerminatedDate("");
    setAvatarFile(null);
    setAvatarPreview("");
  }, [open, isEdit, initial]);

  /* =======================
   * Load WAITER role (CREATE only)
   * ======================= */
  useEffect(() => {
    if (!open || isEdit) return;

    const loadWaiterRole = async () => {
      setRoleLoading(true);
      try {
        const roles = await rbacService.listRoles();

        const waiter =
          (roles ?? []).find(
            (r: any) => String(r.code || "").toUpperCase() === "WAITER",
          ) ||
          (roles ?? []).find(
            (r: any) => String(r.code || "").toUpperCase() === "STAFF",
          );

        if (!waiter?.id) {
          setWaiterRoleId("");
          onToast?.(
            "error",
            "Không tìm thấy role WAITER (hoặc STAFF) trong hệ thống.",
          );
          return;
        }

        setWaiterRoleId(waiter.id);
      } catch (e: any) {
        setWaiterRoleId("");
        onToast?.("error", e?.message || "Không tải được danh sách role.");
      } finally {
        setRoleLoading(false);
      }
    };

    loadWaiterRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit]);

  /* =======================
   * Cleanup preview
   * ======================= */
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  /* =======================
   * Validation
   * ======================= */
  const canSubmit = useMemo(() => {
    if (!ctxRestaurantId || !ctxOutletId) return false;
    if (!fullName.trim()) return false;
    if (!isEdit && !email.trim()) return false;
    if (!isEdit && !waiterRoleId) return false; // ✅ need role
    return true;
  }, [ctxRestaurantId, ctxOutletId, fullName, isEdit, email, waiterRoleId]);

  /* =======================
   * Avatar helpers
   * ======================= */
  const handlePickAvatar = (file: File | null) => {
    setAvatarFile(file);

    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    if (!file) {
      setAvatarPreview("");
      return;
    }
    setAvatarPreview(URL.createObjectURL(file));
  };

  const uploadAvatarIfNeeded = async (staffId: string) => {
    if (!avatarFile) return null;

    setUploading(true);
    try {
      const updated = await staffService.uploadAvatar(staffId, avatarFile);
      setAvatarUrl(updated.avatarUrl ?? "");
      onToast?.("success", "Đã upload avatar.");
      return updated;
    } catch (e: any) {
      onToast?.("error", e?.message || "Upload avatar thất bại.");
      throw e;
    } finally {
      setUploading(false);
    }
  };

  /* =======================
   * Submit
   * ======================= */
  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSaving(true);
    try {
      if (isEdit && initial) {
        const payload: StaffUpdateRequest = {
          restaurantId: ctxRestaurantId!,
          outletId: ctxOutletId!,
          code: code || undefined,
          position: position || undefined,
          avatarUrl: avatarUrl || undefined,
          hiredDate: hiredDate || undefined,
          terminatedDate: terminatedDate || undefined,
          fullName: fullName || undefined,
          phone: phone || undefined,
        };

        const updated = await staffService.update(initial.id, payload);
        await uploadAvatarIfNeeded(updated.id);

        onToast?.("success", "Đã cập nhật nhân viên.");
        await onSuccess?.();
        onClose();
        return;
      }

      // ===== CREATE =====
      const createPayload: StaffCreateRequest = {
        restaurantId: ctxRestaurantId!,
        outletId: ctxOutletId!,
        roleId: waiterRoleId, // ✅ dynamic from BE
        email: email.trim(),
        fullName: fullName.trim(),
        phone: phone || undefined,
        code: code || undefined,
        position: position || undefined,
        avatarUrl: avatarUrl || undefined,
        hiredDate: hiredDate || undefined,
      };

      const created = await staffService.create(createPayload);
      await uploadAvatarIfNeeded(created.id);

      onToast?.("success", "Đã tạo nhân viên.");
      await onSuccess?.();
      onClose();
    } catch (e: any) {
      onToast?.("error", e?.message || "Không thể lưu nhân viên.");
      throw e;
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  /* =======================
   * UI
   * ======================= */
  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="text-lg font-semibold">
            {isEdit ? "Cập nhật nhân viên" : "Tạo nhân viên"}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1 hover:bg-slate-100"
            disabled={saving || uploading}
          >
            Đóng
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {!isEdit && (
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border px-3 py-2"
                placeholder="staff@email.com"
              />
            </div>
          )}

          <div className="md:col-span-2">
            <label className="text-sm font-medium">Họ tên</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Số điện thoại</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Mã nhân viên</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Vị trí</label>
            <input
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Avatar (Upload)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handlePickAvatar(e.target.files?.[0] ?? null)}
              className="mt-1 w-full rounded-xl border px-3 py-2"
              disabled={saving || uploading}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Avatar URL</label>
            <input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2"
              disabled={saving || uploading}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Ngày vào làm</label>
            <input
              type="date"
              value={hiredDate}
              onChange={(e) => setHiredDate(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </div>

          {isEdit && (
            <div>
              <label className="text-sm font-medium">Ngày nghỉ việc</label>
              <input
                type="date"
                value={terminatedDate}
                onChange={(e) => setTerminatedDate(e.target.value)}
                className="mt-1 w-full rounded-xl border px-3 py-2"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 hover:bg-slate-100"
            disabled={saving || uploading}
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || saving || uploading || roleLoading}
            className="rounded-xl px-4 py-2 bg-slate-900 text-white disabled:opacity-50"
          >
            {roleLoading
              ? "Đang tải role..."
              : saving
                ? "Đang lưu..."
                : uploading
                  ? "Đang upload..."
                  : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}
