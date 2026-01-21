// src/features/tables/components/TableDialog.tsx
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  TextField,
  MenuItem,
  Select,
  FormControl,
} from "@mui/material";
import { X, Check, Loader2, Users, Info, MapPin, Plus } from "lucide-react";
import type { Table, TableStatus } from "../../../types/table";

type TableForm = {
  name: string;
  code: string;
  capacity: number;
  groupCode: string;
  status: TableStatus | string;
};

interface TableDialogProps {
  open: boolean;
  table: Table | null; // null = create
  onClose: () => void;
  onSave: (data: TableForm) => Promise<void>;
}

const TableDialog: React.FC<TableDialogProps> = ({
  open,
  table,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<TableForm>({
    name: "",
    code: "",
    capacity: 4,
    groupCode: "",
    status: "AVAILABLE",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (table) {
      setFormData({
        name: table.name ?? "",
        code: table.code ?? "",
        capacity: table.capacity ?? 4,
        groupCode: table.groupCode ?? "",
        status: (table.status as any) ?? "AVAILABLE",
      });
    } else {
      setFormData({
        name: "",
        code: "",
        capacity: 4,
        groupCode: "",
        status: "AVAILABLE",
      });
    }
  }, [table, open]);

  const handleSave = async () => {
    if (!formData.code.trim()) return;
    setIsSaving(true);
    try {
      await onSave({
        ...formData,
        code: formData.code.trim(),
        name: formData.name.trim(),
        groupCode: formData.groupCode.trim(),
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: "2.5rem",
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        },
      }}
    >
      <div className="px-8 pt-8 flex items-center justify-between bg-white relative">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600" />
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
            {table ? <Info size={24} /> : <Plus size={24} />}
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
              {table ? "Cập nhật bàn" : "Tạo bàn mới"}
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
              Cấu hình thông số vận hành
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <DialogContent className="space-y-6 pb-10 bg-white">
        <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 mb-2">
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-relaxed">
            Mã bàn (Code) là định danh duy nhất trong Outlet. Khi đã tạo, không
            nên đổi để tránh lệch dữ liệu.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Tên hiển thị bàn
            </label>
            <TextField
              fullWidth
              variant="filled"
              placeholder="Ví dụ: Bàn Vip 01"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              InputProps={{
                disableUnderline: true,
                sx: {
                  borderRadius: "1.2rem",
                  backgroundColor: "#f8fafc",
                  fontWeight: 900,
                },
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Mã nội bộ (Code)
            </label>
            <TextField
              fullWidth
              variant="filled"
              placeholder="A-01"
              disabled={!!table} // BE update không hỗ trợ đổi code
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
              InputProps={{
                disableUnderline: true,
                sx: { borderRadius: "1.2rem", backgroundColor: "#f8fafc" },
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Sức chứa (Khách)
            </label>
            <div className="relative">
              <TextField
                fullWidth
                variant="filled"
                type="number"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData({ ...formData, capacity: Number(e.target.value) })
                }
                InputProps={{
                  disableUnderline: true,
                  sx: { borderRadius: "1.2rem", backgroundColor: "#f8fafc" },
                }}
              />
              <Users
                size={16}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Khu vực / Phân nhóm
            </label>
            <div className="relative">
              <TextField
                fullWidth
                variant="filled"
                placeholder="Tầng 1, Sân vườn..."
                value={formData.groupCode}
                onChange={(e) =>
                  setFormData({ ...formData, groupCode: e.target.value })
                }
                InputProps={{
                  disableUnderline: true,
                  sx: { borderRadius: "1.2rem", backgroundColor: "#f8fafc" },
                }}
              />
              <MapPin
                size={16}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Trạng thái ban đầu
            </label>
            <FormControl fullWidth variant="filled">
              <Select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as any })
                }
                disableUnderline
                sx={{
                  borderRadius: "1.2rem",
                  backgroundColor: "#f8fafc",
                  fontSize: "12px",
                  fontWeight: 900,
                }}
              >
                <MenuItem value="AVAILABLE">SẴN SÀNG (AVAILABLE)</MenuItem>
                <MenuItem value="OCCUPIED">ĐANG DÙNG (OCCUPIED)</MenuItem>
                <MenuItem value="RESERVED">ĐÃ ĐẶT (RESERVED)</MenuItem>
                <MenuItem value="INACTIVE">BẢO TRÌ (INACTIVE)</MenuItem>
              </Select>
            </FormControl>
          </div>
        </div>

        <div className="flex gap-4 pt-6">
          <button
            onClick={onClose}
            className="flex-1 h-14 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] hover:bg-slate-200 transition-all uppercase tracking-widest"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !formData.code.trim()}
            className="flex-2 px-10 h-14 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-3 transition-all uppercase tracking-widest"
          >
            {isSaving ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Check size={18} strokeWidth={3} />
            )}
            {table ? "Cập nhật bàn" : "Tạo bàn ngay"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TableDialog;
