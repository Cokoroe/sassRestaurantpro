// src/features/staff/components/ConfirmDialog.tsx
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  danger,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b">
          <div className="text-lg font-semibold">{title}</div>
          {description && (
            <div className="mt-1 text-sm text-slate-600">{description}</div>
          )}
        </div>

        <div className="px-5 py-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 hover:bg-slate-100"
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            onClick={() => onConfirm()}
            disabled={loading}
            className={`rounded-xl px-4 py-2 text-white disabled:opacity-50 ${
              danger ? "bg-rose-600" : "bg-slate-900"
            }`}
          >
            {loading ? "Đang xử lý..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
