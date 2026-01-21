import React, { useMemo, useState } from "react";
import { Box, Search, Plus, Copy, Pencil, Trash2, Power } from "lucide-react";
import type {
  CategoryResponse,
  ItemCreateRequest,
  ItemResponse,
  ItemUpdateRequest,
  Status,
} from "../../../types/menu";
import {
  EmptyState,
  MenuThumb,
  SkeletonCard,
  StatChip,
  cx,
} from "./MenuSharedUI";
import ItemDialog from "./ItemDialog";

export default function MenuItemList(props: {
  loading: boolean;
  items: ItemResponse[];
  selectedItemId: string | null;
  onSelectItem: (id: string) => void;

  q: string;
  onChangeQ: (v: string) => void;
  status: Status | "";
  onChangeStatus: (v: Status | "") => void;

  outletId: string;
  categories: CategoryResponse[];
  defaultCategoryId?: string;

  onCreateItem: (
    payload: Omit<ItemCreateRequest, "outletId">
  ) => Promise<ItemResponse>;
  onUpdateItem: (id: string, payload: ItemUpdateRequest) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  onDuplicateItem: (id: string) => Promise<void>;
  onPublishItem: (id: string, next: Status) => Promise<void>;
  onUploadItemImage: (id: string, file: File) => Promise<void>;
}) {
  const [openCreate, setOpenCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const editItem = useMemo(
    () => props.items.find((x) => x.id === editId) ?? null,
    [editId, props.items]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Top toolbar */}
      <div className="p-4 lg:p-6 border-b border-slate-50 bg-slate-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Box size={20} className="text-blue-600" />
          <span className="text-sm font-black text-slate-800 uppercase tracking-tight">
            Món ăn ({props.items?.length ?? 0})
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={props.q}
              onChange={(e) => props.onChangeQ(e.target.value)}
              placeholder="Tìm tên món..."
              className="pl-11 pr-4 h-10 w-full bg-white lg:bg-slate-50 border border-slate-100 rounded-xl text-xs outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/5 transition-all"
            />
          </div>

          <select
            value={props.status}
            onChange={(e) => props.onChangeStatus(e.target.value as any)}
            className="h-10 px-3 rounded-xl border border-slate-100 bg-white text-xs font-black text-slate-700 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/5"
          >
            <option value="">TẤT CẢ</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>

          <button
            onClick={() => setOpenCreate(true)}
            disabled={!props.outletId}
            className="h-10 px-5 rounded-xl bg-slate-900 text-white text-xs font-black hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
          >
            <Plus size={16} /> + TẠO
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50/10 custom-scrollbar">
        {props.loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : props.items.length === 0 ? (
          <EmptyState
            title="Không có dữ liệu"
            desc="Chưa có món ăn nào trong danh mục này."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {props.items.map((item: any) => {
              const active = props.selectedItemId === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => props.onSelectItem(item.id)}
                  className={cx(
                    "p-4 rounded-[1.5rem] lg:rounded-[2rem] border transition-all cursor-pointer relative flex flex-col items-center text-center gap-3 bg-white",
                    active
                      ? "border-blue-600 shadow-xl ring-2 ring-blue-600/5"
                      : "border-slate-100 hover:border-blue-200 hover:shadow-md"
                  )}
                >
                  <MenuThumb src={item.imageUrl} name={item.name} size="lg" />

                  <div className="space-y-1">
                    <h4 className="font-black text-slate-800 text-sm line-clamp-1">
                      {item.name}
                    </h4>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                      Code: {item.code ?? "-"}
                    </p>
                  </div>

                  <div className="absolute top-4 right-4">
                    <StatChip status={item.status} />
                  </div>

                  {/* actions */}
                  <div className="w-full mt-1 flex items-center justify-center gap-2 opacity-100 lg:opacity-0 lg:hover:opacity-100 transition-all">
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        setEditId(item.id);
                      }}
                      className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                      title="Sửa"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        await props.onDuplicateItem(item.id);
                      }}
                      className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100"
                      title="Nhân bản"
                    >
                      <Copy size={16} />
                    </button>

                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        await props.onPublishItem(
                          item.id,
                          item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
                        );
                      }}
                      className={cx(
                        "p-2 rounded-xl bg-slate-50 hover:bg-slate-100",
                        item.status === "ACTIVE"
                          ? "text-emerald-600"
                          : "text-slate-500"
                      )}
                      title="Bật/Tắt"
                    >
                      <Power size={16} />
                    </button>

                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!confirm("Xóa món này?")) return;
                        await props.onDeleteItem(item.id);
                      }}
                      className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                      title="Xóa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE */}
      <ItemDialog
        open={openCreate}
        title="Tạo món"
        outletId={props.outletId}
        categories={props.categories}
        defaultCategoryId={props.defaultCategoryId}
        onClose={() => setOpenCreate(false)}
        onSubmit={async ({ kind, payload, imageFile }) => {
          if (kind !== "create") return;
          const { outletId: _ignored, ...rest } = payload as ItemCreateRequest;
          const created = await props.onCreateItem(rest);
          if (imageFile) await props.onUploadItemImage(created.id, imageFile);
          setOpenCreate(false);
        }}
      />

      {/* UPDATE */}
      <ItemDialog
        open={!!editId}
        title="Cập nhật món"
        outletId={props.outletId}
        categories={props.categories}
        defaultCategoryId={props.defaultCategoryId}
        initial={
          editItem
            ? {
                name: editItem.name,
                code: editItem.code ?? null,
                categoryId: (editItem as any).categoryId ?? null,
                description: (editItem as any).description ?? null,
                imageUrl: (editItem as any).imageUrl ?? null,
                status: editItem.status,
                tags: (editItem as any).tags ?? [],
                basePrice: (editItem as any).basePrice ?? 0,
              }
            : undefined
        }
        onClose={() => setEditId(null)}
        onSubmit={async ({ kind, payload, imageFile }) => {
          if (!editId) return;
          if (kind !== "update") return;
          await props.onUpdateItem(editId, payload as ItemUpdateRequest);
          if (imageFile) await props.onUploadItemImage(editId, imageFile);
          setEditId(null);
        }}
      />
    </div>
  );
}
