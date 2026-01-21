// src/features/tables/components/ConfirmDeleteDialog.tsx
import React from "react";
import { Dialog, DialogContent } from "@mui/material";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";
import type { Table } from "../../../types/table";

interface ConfirmDeleteDialogProps {
  open: boolean;
  table: Table | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({
  open,
  table,
  loading,
  onClose,
  onConfirm,
}) => {
  if (!table) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { borderRadius: "2rem", maxWidth: "420px" } }}
    >
      <DialogContent className="p-8 text-center space-y-6">
        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
          <AlertTriangle size={40} />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 uppercase">
            Xác nhận xóa?
          </h2>
          <p className="text-slate-500 text-sm font-medium">
            Bạn có chắc chắn muốn xóa{" "}
            <span className="text-slate-900 font-black">
              "{table.name ?? table.code}"
            </span>
            ?
          </p>
        </div>

        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-left">
          <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">
            Lưu ý hệ thống
          </p>
          <p className="text-[11px] text-amber-600 font-bold leading-relaxed">
            Nếu bàn đang có phiên (Session) đang mở, hệ thống sẽ chặn xóa để đảm
            bảo toàn vẹn dữ liệu hóa đơn.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-12 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all uppercase text-xs tracking-widest"
          >
            Bỏ qua
          </button>
          <button
            disabled={loading}
            onClick={() => onConfirm(table.id)}
            className="flex-1 h-12 bg-rose-600 text-white rounded-xl font-black shadow-lg shadow-rose-600/20 hover:bg-rose-700 disabled:opacity-50 flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Trash2 size={16} />
            )}
            Xác nhận xóa
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDeleteDialog;
