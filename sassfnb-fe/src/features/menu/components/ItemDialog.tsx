// src/features/menu/components/ItemDialog.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@mui/material";
import { ImagePlus, X } from "lucide-react";
import type {
  CategoryResponse,
  ItemCreateRequest,
  ItemUpdateRequest,
  Status,
} from "../../../types/menu";

type SubmitResult =
  | {
      kind: "create";
      payload: ItemCreateRequest;
      imageFile: File | null;
    }
  | {
      kind: "update";
      payload: ItemUpdateRequest;
      imageFile: File | null;
    };

type Props = {
  open: boolean;
  title: string;
  outletId: string;
  categories: CategoryResponse[];
  defaultCategoryId?: string;

  // initial có nghĩa là đang edit
  initial?: {
    name: string;
    code?: string | null;
    categoryId?: string | null;
    description?: string | null;
    imageUrl?: string | null;
    status?: Status;
    tags?: string[];
    basePrice?: number | null;
  };

  onClose: () => void;
  onSubmit: (data: SubmitResult) => Promise<void>;
};

export default function ItemDialog(props: Props) {
  const {
    open,
    title,
    outletId,
    categories,
    defaultCategoryId,
    initial,
    onClose,
    onSubmit,
  } = props;

  const firstActiveCatId = useMemo(() => {
    const c = categories.find((x) => x.status === "ACTIVE");
    return c?.id;
  }, [categories]);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Status>("ACTIVE");
  const [tagsText, setTagsText] = useState("");
  const [basePrice, setBasePrice] = useState<number>(0);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setName(initial?.name ?? "");
    setCode(initial?.code ?? "");
    setDescription(initial?.description ?? "");
    setStatus(initial?.status ?? "ACTIVE");
    setBasePrice(Number(initial?.basePrice ?? 0));

    const cid = (
      initial?.categoryId ??
      defaultCategoryId ??
      firstActiveCatId ??
      ""
    ).toString();
    setCategoryId(cid);

    setTagsText((initial?.tags ?? []).join(","));
    setImageFile(null);
    setPreviewUrl(null);
  }, [open, initial, defaultCategoryId, firstActiveCatId]);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const tags = tagsText
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const canSubmit = Boolean(name.trim() && categoryId && basePrice >= 0);

  const categoriesForSelect = categories.filter((c) => c.status !== "DELETED");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: { borderRadius: "2rem", overflow: "hidden" },
      }}
    >
      {/* Header */}
      <div className="px-7 pt-7 pb-4 bg-white flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg lg:text-xl font-black text-slate-900">
            {title}
          </h2>
          <p className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
            {initial ? "Cập nhật thông tin món" : "Tạo món mới"}
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-full text-slate-400 hover:bg-slate-50"
          title="Đóng"
        >
          <X size={20} />
        </button>
      </div>

      <DialogContent className="px-7 pb-7">
        {/* Body grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* LEFT: Image */}
          <div className="lg:col-span-5">
            <div className="p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Ảnh món
              </p>

              <div className="mt-3">
                <div className="w-full aspect-square rounded-[1.5rem] border border-slate-200 bg-white overflow-hidden flex items-center justify-center">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                  ) : initial?.imageUrl ? (
                    <img
                      src={initial.imageUrl}
                      alt="current"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-slate-400 flex flex-col items-center gap-2">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <ImagePlus size={26} />
                      </div>
                      <p className="text-xs font-bold">Chưa có ảnh</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        png / jpg / webp
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <label className="flex-1">
                    <input
                      hidden
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={(e) =>
                        setImageFile(e.target.files?.[0] ?? null)
                      }
                    />
                    <span className="h-10 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white text-xs font-black hover:bg-blue-600 transition-all cursor-pointer">
                      <ImagePlus size={16} />
                      CHỌN ẢNH
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setImageFile(null)}
                    className="h-10 px-4 rounded-xl bg-slate-100 text-slate-700 text-xs font-black hover:bg-slate-200 transition-all"
                    disabled={!imageFile}
                    title="Bỏ ảnh vừa chọn"
                  >
                    BỎ
                  </button>
                </div>

                <p className="mt-2 text-[11px] text-slate-500">
                  {imageFile
                    ? `Đã chọn: ${imageFile.name}`
                    : initial?.imageUrl
                    ? "Đang dùng ảnh hiện tại"
                    : "Chưa chọn ảnh"}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: Form */}
          <div className="lg:col-span-7">
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Tên món
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Trà sữa trân châu..."
                  className="mt-2 h-11 w-full px-4 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              {/* Code + Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Code (optional)
                  </label>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="VD: TS-001"
                    className="mt-2 h-11 w-full px-4 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Base price
                  </label>
                  <input
                    value={basePrice}
                    type="number"
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                    className="mt-2 h-11 w-full px-4 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(String(e.target.value))}
                  className="mt-2 h-11 w-full px-4 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-800 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
                >
                  <option value="" disabled>
                    Chọn danh mục...
                  </option>
                  {categoriesForSelect.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Mô tả
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả ngắn..."
                  className="mt-2 min-h-[90px] w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 resize-none"
                />
              </div>

              {/* Status + Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Status)}
                    className="mt-2 h-11 w-full px-4 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-800 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="DELETED">DELETED</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Tags
                  </label>
                  <input
                    value={tagsText}
                    onChange={(e) => setTagsText(e.target.value)}
                    placeholder="tea,cold"
                    className="mt-2 h-11 w-full px-4 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="h-12 px-6 rounded-xl bg-slate-100 text-slate-700 text-xs font-black hover:bg-slate-200 transition-all"
          >
            HỦY
          </button>

          <button
            disabled={!canSubmit}
            onClick={async () => {
              const base = {
                name: name.trim(),
                code: code.trim() || null,
                categoryId,
                description: description.trim() || null,
                status,
                tags,
                basePrice,
              };

              if (!initial) {
                await onSubmit({
                  kind: "create",
                  payload: { outletId, ...base } as ItemCreateRequest,
                  imageFile,
                });
              } else {
                await onSubmit({
                  kind: "update",
                  payload: base as any as ItemUpdateRequest,
                  imageFile,
                });
              }
            }}
            className="h-12 px-8 rounded-xl bg-blue-600 text-white text-xs font-black hover:bg-blue-700 transition-all disabled:opacity-50 disabled:hover:bg-blue-600 shadow-lg shadow-blue-500/15"
          >
            LƯU
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
