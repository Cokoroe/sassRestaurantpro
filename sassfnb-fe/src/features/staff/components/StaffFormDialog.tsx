// src/features/staff/components/StaffFormDialog.tsx
import { useEffect, useMemo, useState } from "react";
import type {
  Staff,
  StaffCreateRequest,
  StaffUpdateRequest,
} from "../../../types/staff";
import { staffService } from "../../../api/services/staff.service";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  initial?: Staff | null;
  onClose: () => void;

  // NOTE: onSubmit hiện tại của bạn chỉ nhận payload,
  // mình vẫn giữ, nhưng sẽ dùng staffService.create/update trực tiếp để hỗ trợ create->upload.
  // Nếu bạn muốn giữ onSubmit như cũ, mình cũng có thể refactor,
  // nhưng cách dưới là sạch và ít bug hơn cho flow upload.
  onSubmit?: (
    payload: StaffCreateRequest | StaffUpdateRequest,
  ) => Promise<void>;

  ctxRestaurantId?: string | null;
  ctxOutletId?: string | null;

  // ✅ NEW: để refresh list sau khi tạo/sửa/upload
  onSuccess?: () => Promise<void> | void;

  // ✅ NEW: toast callback optional
  onToast?: (kind: "success" | "error" | "info", message: string) => void;
};

// ✅ WAITER role cố định
const DEFAULT_WAITER_ROLE_ID = "2eacff60-9da5-4f1d-85c1-1eeeb488628c";

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

  // ✅ NEW: avatar file + preview
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

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

  // cleanup preview url
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const canSubmit = useMemo(() => {
    if (!ctxRestaurantId || !ctxOutletId) return false;
    if (!fullName.trim()) return false;
    if (!isEdit && !email.trim()) return false;
    return true;
  }, [ctxRestaurantId, ctxOutletId, fullName, isEdit, email]);

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
          avatarUrl: avatarUrl || undefined, // vẫn cho set thủ công nếu cần
          hiredDate: hiredDate || undefined,
          terminatedDate: terminatedDate || undefined,
          fullName: fullName || undefined,
          phone: phone || undefined,
        };

        // 1) update staff
        const updated = await staffService.update(initial.id, payload);

        // 2) nếu có file thì upload avatar (ưu tiên file hơn url)
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
        roleId: DEFAULT_WAITER_ROLE_ID,
        email: email.trim(),
        fullName: fullName.trim(),
        phone: phone || undefined,
        code: code || undefined,
        position: position || undefined,
        avatarUrl: avatarUrl || undefined, // nếu user dán url
        hiredDate: hiredDate || undefined,
      };

      // 1) create staff
      const created = await staffService.create(createPayload);

      // 2) auto upload avatar nếu user đã chọn file
      // (Nếu bạn không muốn auto upload sau create thì comment dòng này)
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
              <p className="mt-1 text-xs text-slate-500">
                Khi tạo, hệ thống sẽ tự tạo tài khoản user nếu email chưa tồn
                tại.
              </p>
            </div>
          )}

          <div className="md:col-span-2">
            <label className="text-sm font-medium">Họ tên</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2"
              placeholder="Nguyễn Văn A"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Số điện thoại</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2"
              placeholder="09xxxxxxx"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Mã nhân viên</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2"
              placeholder="NV001"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Vị trí</label>
            <input
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2"
              placeholder="WAITER / CASHIER..."
            />
          </div>

          {/* ✅ Avatar upload */}
          <div>
            <label className="text-sm font-medium">Avatar (Upload)</label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(e) => handlePickAvatar(e.target.files?.[0] ?? null)}
              className="mt-1 w-full rounded-xl border px-3 py-2"
              disabled={uploading || saving}
            />
            <p className="mt-1 text-xs text-slate-500">
              PNG/JPG/WEBP tối đa 5MB.
            </p>
          </div>

          {/* ✅ Avatar preview + url */}
          <div>
            <label className="text-sm font-medium">Avatar URL</label>
            <input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2"
              placeholder="https://..."
              disabled={uploading || saving}
            />
            <div className="mt-2 flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl border overflow-hidden bg-slate-50">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="preview"
                    className="h-full w-full object-cover"
                  />
                ) : avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs text-slate-400">
                    No
                  </div>
                )}
              </div>

              {isEdit && initial?.id && avatarFile && (
                <button
                  type="button"
                  onClick={() => uploadAvatarIfNeeded(initial.id)}
                  className="rounded-xl border px-3 py-2 hover:bg-slate-50 disabled:opacity-50"
                  disabled={uploading || saving}
                >
                  {uploading ? "Đang upload..." : "Upload ngay"}
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Ngày vào làm</label>
            <input
              type="date"
              value={hiredDate}
              onChange={(e) => setHiredDate(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2"
              disabled={uploading || saving}
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
                disabled={uploading || saving}
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 hover:bg-slate-100 disabled:opacity-50"
            disabled={saving || uploading}
          >
            Hủy
          </button>
          <button
            disabled={!canSubmit || saving || uploading}
            onClick={handleSubmit}
            className="rounded-xl px-4 py-2 bg-slate-900 text-white disabled:opacity-50"
          >
            {saving ? "Đang lưu..." : uploading ? "Đang upload..." : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}
