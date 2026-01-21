// src/features/menu/components/OptionDialog.tsx
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  TextField,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { Loader2, X } from "lucide-react";

interface OptionDialogProps {
  open: boolean;
  type: "group" | "value";
  data: any | null;
  onClose: () => void;
  onSave: (data: any) => Promise<void> | void; // ✅ allow async
}

export default function OptionDialog({
  open,
  type,
  data,
  onClose,
  onSave,
}: OptionDialogProps) {
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setErr(null);
    setSaving(false);

    if (!open) return;

    if (type === "group") {
      setForm(data || { name: "", required: false, multiSelect: false });
    } else {
      setForm(data || { name: "", extraPrice: 0 });
    }
  }, [data, type, open]);

  const canSave = !!form.name && !saving;

  const extractErrMsg = (e: any) => {
    return (
      e?.response?.data?.message ||
      e?.response?.data?.error ||
      e?.message ||
      "Lưu thất bại"
    );
  };

  return (
    <Dialog
      open={open}
      onClose={() => (saving ? null : onClose())}
      fullWidth
      maxWidth="xs"
      PaperProps={{ sx: { borderRadius: "2rem", overflow: "hidden" } }}
    >
      <div className="p-7 pb-0 flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-900">
          {type === "group"
            ? data
              ? "Sửa nhóm tùy chọn"
              : "Thêm nhóm tùy chọn"
            : data
            ? "Sửa giá trị"
            : "Thêm giá trị"}
        </h2>

        <button
          onClick={() => (saving ? null : onClose())}
          className="p-2 text-slate-400 hover:bg-slate-50 rounded-full disabled:opacity-50"
          disabled={saving}
        >
          <X size={20} />
        </button>
      </div>

      <DialogContent className="space-y-5 pb-8">
        {err && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-sm">
            {err}
          </div>
        )}

        <TextField
          fullWidth
          label="Tên gọi"
          variant="filled"
          value={form.name || ""}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          InputProps={{
            disableUnderline: true,
            sx: { borderRadius: "1.2rem" },
          }}
        />

        {type === "group" ? (
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-3xl">
            <FormControlLabel
              control={
                <Switch
                  checked={!!form.required}
                  onChange={(e) =>
                    setForm({ ...form, required: e.target.checked })
                  }
                />
              }
              label={
                <span className="text-xs font-bold text-slate-700">
                  Bắt buộc
                </span>
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={!!form.multiSelect}
                  onChange={(e) =>
                    setForm({ ...form, multiSelect: e.target.checked })
                  }
                />
              }
              label={
                <span className="text-xs font-bold text-slate-700">
                  Chọn nhiều
                </span>
              }
            />
          </div>
        ) : (
          <TextField
            fullWidth
            label="Giá cộng thêm"
            type="number"
            variant="filled"
            value={form.extraPrice ?? 0}
            onChange={(e) =>
              setForm({ ...form, extraPrice: Number(e.target.value) })
            }
            InputProps={{
              disableUnderline: true,
              sx: { borderRadius: "1.2rem" },
            }}
          />
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => (saving ? null : onClose())}
            className="flex-1 h-12 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 disabled:opacity-50"
            disabled={saving}
          >
            Hủy
          </button>

          <button
            disabled={!canSave}
            onClick={async () => {
              try {
                setErr(null);
                setSaving(true);
                await onSave(form);
                onClose();
              } catch (e: any) {
                setErr(extractErrMsg(e));
              } finally {
                setSaving(false);
              }
            }}
            className="px-8 h-12 bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={18} className="animate-spin" />}
            Lưu
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
