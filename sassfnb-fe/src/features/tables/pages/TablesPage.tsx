// src/features/tables/pages/TablesPage.tsx
import React, { useMemo, useState } from "react";
import {
  Plus,
  RefreshCw,
  Search,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Box,
  FilterX,
} from "lucide-react";

import { useTables } from "../hooks/useTables";
import { useAppContextStore } from "../../../store/useAppContextStore";
import TableCard from "../components/TableCard";
import TableDetailPanel from "../components/TableDetailPanel";
import TableDialog from "../components/TableDialog";
import ConfirmDeleteDialog from "../components/ConfirmDeleteDialog";
import type { Table } from "../../../types/table";

const TablesPage: React.FC = () => {
  // context
  const restaurantName = useAppContextStore((s) => s.restaurantName);
  const outletName = useAppContextStore((s) => s.outletName);

  // VM
  const vm = useTables();
  const canManage = true;

  // dialog state
  const [dialog, setDialog] = useState<{ open: boolean; data: Table | null }>({
    open: false,
    data: null,
  });
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    data: Table | null;
  }>({ open: false, data: null });

  const selected = vm.selected;

  const totalPages = useMemo(() => {
    if (!vm.size) return 1;
    return Math.max(1, Math.ceil(vm.totalElements / vm.size));
  }, [vm.totalElements, vm.size]);

  const openCreate = () => setDialog({ open: true, data: null });
  const openEdit = (t: Table) => setDialog({ open: true, data: t });
  const closeDialog = () => setDialog({ open: false, data: null });

  const openDelete = (id: string) => {
    const t = vm.list.find((x) => x.id === id) ?? null;
    if (t) setDeleteModal({ open: true, data: t });
  };

  const confirmDelete = async (id: string) => {
    try {
      await vm.deleteTable(id);
      setDeleteModal({ open: false, data: null });
    } catch (e: any) {
      alert(e?.message ?? "Xóa thất bại");
    }
  };

  const clearFilters = () => vm.clearFilters();

  const saveDialog = async (data: {
    name: string;
    code: string;
    capacity: number;
    groupCode: string;
    status: string;
  }) => {
    if (dialog.data?.id) {
      await vm.updateTable(dialog.data.id, {
        name: data.name,
        capacity: data.capacity,
        groupCode: data.groupCode || null,
        status: data.status,
      });
    } else {
      await vm.createTable({
        code: data.code,
        name: data.name || null,
        capacity: data.capacity,
        groupCode: data.groupCode || null,
        status: data.status,
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700 max-w-[1600px] mx-auto pb-20">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 lg:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 bg-blue-600 text-white text-[10px] font-black rounded uppercase tracking-tighter shadow-lg shadow-blue-500/20">
              Dashboard
            </span>
            <span className="text-slate-300 text-xs">/</span>
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest truncate max-w-[260px]">
              {restaurantName ?? "-"} / {outletName ?? "-"}
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
            Quản lý sơ đồ bàn
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Quản lý trạng thái, vị trí và mã QR gọi món tại chỗ.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all border border-slate-100 bg-white"
            title="Làm mới dữ liệu"
            onClick={vm.reload}
          >
            <RefreshCw size={20} />
          </button>
          <button
            onClick={openCreate}
            disabled={!canManage}
            className="h-14 px-8 bg-slate-900 text-white rounded-[1.2rem] font-black text-sm hover:bg-blue-600 transition-all flex items-center gap-3 shadow-xl shadow-slate-900/10 active:scale-95 disabled:opacity-50"
          >
            <Plus size={20} strokeWidth={3} /> TẠO BÀN MỚI
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-8 space-y-6">
          {/* TOOLBAR */}
          <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Tìm theo tên hoặc mã nội bộ..."
                value={vm.q}
                onChange={(e) => vm.setQ(e.target.value)}
                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-300 transition-all"
              />
            </div>

            <select
              value={vm.status || "ALL"}
              onChange={(e) =>
                vm.setStatus(e.target.value === "ALL" ? "" : e.target.value)
              }
              className="h-12 px-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest outline-none appearance-none cursor-pointer hover:border-blue-300 transition-colors"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="AVAILABLE">Sẵn sàng</option>
              <option value="OCCUPIED">Đang dùng</option>
              <option value="RESERVED">Đã đặt</option>
              <option value="INACTIVE">Bảo trì</option>
            </select>

            <div className="relative w-full sm:w-auto flex-1 sm:flex-none sm:min-w-[180px]">
              <MapPin
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Khu vực..."
                value={vm.groupCode}
                onChange={(e) => vm.setGroupCode(e.target.value)}
                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-4 text-sm font-medium outline-none"
              />
            </div>

            <select
              value={vm.size}
              onChange={(e) => {
                vm.setSize(Number(e.target.value));
                vm.setPage(0);
              }}
              className="h-12 px-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none"
            >
              <option value={10}>10 / Trang</option>
              <option value={20}>20 / Trang</option>
              <option value={50}>50 / Trang</option>
            </select>

            {vm.q || vm.status || vm.groupCode ? (
              <button
                onClick={clearFilters}
                className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                title="Xóa lọc"
              >
                <FilterX size={18} />
              </button>
            ) : null}
          </div>

          {/* GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {vm.loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-40 bg-white rounded-[2rem] border border-slate-100 animate-pulse flex flex-col p-6 gap-4"
                >
                  <div className="h-6 bg-slate-100 rounded-full w-2/3" />
                  <div className="h-4 bg-slate-50 rounded-full w-1/3" />
                  <div className="mt-auto h-8 bg-slate-50 rounded-full w-1/2" />
                </div>
              ))
            ) : vm.list.length === 0 ? (
              <div className="col-span-full py-24 bg-white rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 animate-in zoom-in duration-300">
                <Box size={64} className="opacity-10 mb-4" />
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">
                  Trống
                </h3>
                <p className="text-sm font-medium mt-1">
                  Không tìm thấy bàn nào khớp với bộ lọc hiện tại.
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-4 px-6 py-2 bg-slate-100 text-slate-600 rounded-full text-xs font-black uppercase"
                >
                  Xóa lọc
                </button>
              </div>
            ) : (
              vm.list.map((t) => (
                <TableCard
                  key={t.id}
                  table={t}
                  active={selected?.id === t.id}
                  canManage={canManage}
                  onSelect={(id) => {
                    const found = vm.list.find((x) => x.id === id) ?? null;
                    vm.setSelected(found);
                  }}
                  onEdit={openEdit}
                  onDelete={openDelete}
                />
              ))
            )}
          </div>

          {/* PAGINATION */}
          {!vm.loading && vm.list.length > 0 ? (
            <div className="flex items-center justify-between bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest ml-4">
                Hiển thị{" "}
                <span className="text-slate-900">{vm.list.length}</span> /{" "}
                {vm.totalElements} bàn
              </p>

              <div className="flex items-center gap-2">
                <button
                  className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all disabled:opacity-30"
                  disabled={vm.page <= 0}
                  onClick={() => vm.setPage(Math.max(0, vm.page - 1))}
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="px-4 text-sm font-black text-slate-900">
                  Trang {vm.page + 1} / {totalPages}
                </div>
                <button
                  className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all disabled:opacity-30"
                  disabled={vm.page + 1 >= totalPages}
                  onClick={() =>
                    vm.setPage(Math.min(totalPages - 1, vm.page + 1))
                  }
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* RIGHT COLUMN */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24">
          <TableDetailPanel
            table={selected}
            dynamicQr={vm.dynamicQr}
            staticQr={vm.staticQr}
            canManage={canManage}
            onRotate={vm.rotateDynamic}
            onDisableDynamic={vm.disableDynamic}
            onGenerateStatic={vm.generateStatic}
            onRefreshStatic={vm.refreshStatic}
          />
        </aside>
      </div>

      {/* Dialogs */}
      <TableDialog
        open={dialog.open}
        table={dialog.data}
        onClose={closeDialog}
        onSave={saveDialog}
      />

      <ConfirmDeleteDialog
        open={deleteModal.open}
        table={deleteModal.data}
        loading={vm.loading}
        onClose={() => setDeleteModal({ open: false, data: null })}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default TablesPage;
