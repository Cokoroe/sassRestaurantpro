// src/features/staff/components/StaffToast.tsx
import { useEffect } from "react";

export type StaffToastKind = "success" | "error" | "info";

export type StaffToastState = {
  open: boolean;
  kind: StaffToastKind;
  message: string;
};

export function StaffToast({
  state,
  onClose,
}: {
  state: StaffToastState;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!state.open) return;
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [state.open, onClose]);

  if (!state.open) return null;

  const base =
    "fixed bottom-5 right-5 z-[60] rounded-2xl px-4 py-3 shadow-lg border text-sm";
  const tone =
    state.kind === "success"
      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
      : state.kind === "error"
        ? "bg-rose-50 border-rose-200 text-rose-800"
        : "bg-slate-50 border-slate-200 text-slate-800";

  return (
    <div className={`${base} ${tone}`}>
      <div className="font-semibold mb-0.5">
        {state.kind === "success"
          ? "Thành công"
          : state.kind === "error"
            ? "Lỗi"
            : "Thông báo"}
      </div>
      <div>{state.message}</div>
    </div>
  );
}
