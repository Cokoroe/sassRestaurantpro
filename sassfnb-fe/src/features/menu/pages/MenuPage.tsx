import React, { useEffect, useRef } from "react";
import { AlertTriangle, LayoutGrid, Plus } from "lucide-react";
import { useMenu } from "../hooks/useMenu";
import MenuCategoryList from "../components/MenuCategoryList";
import MenuItemList from "../components/MenuItemList";
import MenuItemOptionsPanel from "../components/MenuItemOptionsPanel";

export default function MenuPage() {
  const m = useMenu();
  const bottomRowRef = useRef<HTMLDivElement>(null);

  // Mobile/tablet: khi chọn item thì auto scroll xuống panel cấu hình
  useEffect(() => {
    if (m.selectedItemId && bottomRowRef.current && window.innerWidth < 1024) {
      bottomRowRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [m.selectedItemId]);

  return (
    <div className="max-w-[1600px] mx-auto pb-20 px-4 lg:px-6 animate-in fade-in duration-700">
      <div className="flex flex-col gap-6 lg:gap-8">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 lg:p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-600 rounded-xl lg:rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20 shrink-0">
              <LayoutGrid size={20} className="lg:hidden" />
              <LayoutGrid size={24} className="hidden lg:block" />
            </div>

            <div>
              <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight uppercase">
                Menu Studio
              </h1>
              <p className="text-slate-500 text-[10px] lg:text-xs font-bold uppercase tracking-widest">
                Quản lý thực đơn đa tầng
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => m.setSelectedItemId(null)}
              className="flex-1 sm:flex-none h-11 px-4 bg-slate-100 text-slate-700 rounded-xl font-black text-xs hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
              title="Bỏ chọn món"
            >
              <span className="whitespace-nowrap">BỎ CHỌN</span>
            </button>

            {/* Nút tạo món đặt ở list (MenuItemList) cũng có, đây là nút “nhanh” */}
            <button
              onClick={() => {
                // mở dialog create ở MenuItemList (nút + Tạo trong list)
                // nút này chỉ để style header; nếu muốn bật dialog từ đây thì cần “expose” handler
                // => giữ đơn giản: người dùng tạo qua nút + Tạo trong list
              }}
              className="flex-1 sm:flex-none h-11 px-6 bg-slate-900 text-white rounded-xl font-black text-xs hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg"
              title="Tạo món mới (dùng nút + Tạo trong danh sách món)"
            >
              <Plus size={18} />{" "}
              <span className="whitespace-nowrap">MÓN MỚI</span>
            </button>
          </div>
        </div>

        {/* WARNINGS */}
        {!m.outletId && (
          <div className="bg-amber-50 border border-amber-100 rounded-[1.5rem] p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="font-black text-amber-900 text-sm">
                Chưa có outletId
              </p>
              <p className="text-amber-800/80 text-sm">
                Hãy chọn Outlet ở sidebar trước để tải danh mục và món ăn.
              </p>
            </div>
          </div>
        )}

        {m.error && (
          <div className="bg-rose-50 border border-rose-100 rounded-[1.5rem] p-4">
            <p className="font-black text-rose-800 text-sm">Lỗi</p>
            <p className="text-rose-700 text-sm mt-1">{m.error}</p>
          </div>
        )}

        {/* ROW 1: CATEGORIES | ITEMS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Categories */}
          <div className="col-span-1 lg:col-span-3 bg-white rounded-[2rem] lg:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden h-auto lg:h-[560px]">
            <MenuCategoryList
              loading={m.loadingCats}
              categories={m.categories}
              selectedCategoryId={m.selectedCategoryId}
              onSelectCategory={m.setSelectedCategoryId}
              onCreateCategory={m.createCategory}
              onUpdateCategory={m.updateCategory}
              onDeleteCategory={m.deleteCategory}
            />
          </div>

          {/* Items */}
          <div className="col-span-1 lg:col-span-9 bg-white rounded-[2rem] lg:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden h-auto lg:h-[560px]">
            <MenuItemList
              loading={m.loadingItems}
              items={m.items}
              selectedItemId={m.selectedItemId}
              onSelectItem={m.setSelectedItemId}
              q={m.q}
              onChangeQ={m.setQ}
              status={m.status}
              onChangeStatus={m.setStatus}
              outletId={m.outletId || ""}
              categories={m.categories}
              defaultCategoryId={
                m.selectedCategoryId === "ALL"
                  ? undefined
                  : m.selectedCategoryId
              }
              onCreateItem={m.createItem}
              onUpdateItem={m.updateItem}
              onDeleteItem={m.deleteItem}
              onDuplicateItem={m.duplicateItem}
              onPublishItem={m.publishItem}
              onUploadItemImage={m.uploadItemImage}
            />
          </div>
        </div>

        {/* ROW 2: OPTIONS PANEL */}
        <div
          ref={bottomRowRef}
          className={`transition-all duration-700 transform ${
            m.selectedItemId
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10 lg:translate-y-20 pointer-events-none"
          }`}
        >
          <div className="bg-white rounded-[2rem] lg:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <MenuItemOptionsPanel
              loading={m.loadingDetail}
              detail={m.detail}
              selectedItemId={m.selectedItemId}
              onCreateOption={m.createOption}
              onUpdateOption={m.updateOption}
              onDeleteOption={m.deleteOption}
              onCreateValue={m.createOptionValue}
              onUpdateValue={m.updateOptionValue}
              onDeleteValue={m.deleteOptionValue}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
