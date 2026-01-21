import React, { useMemo, useState } from "react";
import { ChevronRight, Filter, Plus, Edit3, Trash2 } from "lucide-react";
import type {
  CategoryCreateRequest,
  CategoryResponse,
  CategoryUpdateRequest,
} from "../../../types/menu";
import { cx } from "./MenuSharedUI";

export default function MenuCategoryList(props: {
  loading: boolean;
  categories: CategoryResponse[];
  selectedCategoryId: string | "ALL";
  onSelectCategory: (id: string | "ALL") => void;
  onCreateCategory: (
    payload: Omit<CategoryCreateRequest, "outletId">
  ) => Promise<void>;
  onUpdateCategory: (
    id: string,
    payload: CategoryUpdateRequest
  ) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}) {
  const [openCreate, setOpenCreate] = useState(false);
  const [name, setName] = useState("");

  const counts = useMemo(() => {
    const total = props.categories?.length ?? 0;
    return { total };
  }, [props.categories]);

  const submitCreate = async () => {
    if (!name.trim()) return;
    await props.onCreateCategory({ name: name.trim() } as any);
    setName("");
    setOpenCreate(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 lg:p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-blue-600" />
          <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
            Danh mục ({counts.total})
          </span>
        </div>

        <button
          onClick={() => setOpenCreate((v) => !v)}
          className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
          title="Thêm danh mục"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Create inline */}
      {openCreate && (
        <div className="p-4 border-b border-slate-50 bg-white">
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tên danh mục..."
              className="h-10 flex-1 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
            />
            <button
              onClick={submitCreate}
              disabled={!name.trim()}
              className="h-10 px-4 rounded-xl bg-slate-900 text-white text-xs font-black hover:bg-blue-600 disabled:opacity-50"
            >
              Lưu
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-1.5 custom-scrollbar">
        <button
          onClick={() => props.onSelectCategory("ALL")}
          className={cx(
            "w-full flex items-center justify-between p-3 lg:p-4 rounded-xl lg:rounded-2xl transition-all font-bold text-sm",
            props.selectedCategoryId === "ALL"
              ? "bg-blue-600 text-white shadow-lg"
              : "text-slate-500 hover:bg-slate-50"
          )}
        >
          Tất cả món ăn
          <ChevronRight
            size={16}
            className={
              props.selectedCategoryId === "ALL" ? "opacity-100" : "opacity-20"
            }
          />
        </button>

        {props.loading ? (
          <div className="p-4 text-sm text-slate-500">Đang tải danh mục...</div>
        ) : (
          props.categories.map((cat: any) => (
            <div key={cat.id} className="group relative">
              <button
                onClick={() => props.onSelectCategory(cat.id)}
                className={cx(
                  "w-full flex items-center justify-between p-3 lg:p-4 rounded-xl lg:rounded-2xl transition-all font-bold text-sm",
                  props.selectedCategoryId === cat.id
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-500 hover:bg-slate-50"
                )}
              >
                <span className="truncate pr-10">{cat.name}</span>

                <span
                  className={cx(
                    "text-[10px] px-2 py-0.5 rounded-full font-black",
                    props.selectedCategoryId === cat.id
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-500"
                  )}
                >
                  {cat.itemCount ?? 0}
                </span>
              </button>

              {/* hover actions */}
              <div className="absolute right-12 top-1/2 -translate-y-1/2 hidden lg:group-hover:flex items-center gap-1 animate-in slide-in-from-right-2">
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    const next = prompt("Sửa tên danh mục:", cat.name);
                    if (!next?.trim()) return;
                    await props.onUpdateCategory(cat.id, {
                      name: next.trim(),
                    } as any);
                  }}
                  className={cx(
                    "p-1.5 rounded-md",
                    props.selectedCategoryId === cat.id
                      ? "text-white hover:bg-white/10"
                      : "text-slate-300 hover:text-blue-600"
                  )}
                  title="Sửa"
                >
                  <Edit3 size={14} />
                </button>

                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!confirm("Xóa danh mục này?")) return;
                    await props.onDeleteCategory(cat.id);
                  }}
                  className={cx(
                    "p-1.5 rounded-md",
                    props.selectedCategoryId === cat.id
                      ? "text-white hover:bg-white/10"
                      : "text-slate-300 hover:text-rose-500"
                  )}
                  title="Xóa"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
