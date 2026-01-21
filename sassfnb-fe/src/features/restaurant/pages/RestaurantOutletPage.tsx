// src/features/restaurant/pages/RestaurantOutletPage.tsx
import React, { useMemo, useState } from "react";
import type { Restaurant } from "../../../types/restaurant";
import type { Outlet } from "../../../types/outlet";
import { useRestaurantOutlet } from "../hooks/useRestaurantOutlet";
import OpenHoursPicker from "../components/OpenHoursPicker";

type ModalType =
  | "res_detail"
  | "res_form"
  | "outlet_detail"
  | "outlet_form"
  | null;

const Modal = ({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children?: React.ReactNode;
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-black text-slate-900 text-lg">{title}</h3>
          <button
            onClick={onClose}
            className="h-10 w-10 grid place-items-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

const FormField = ({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children?: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <label className="text-sm font-black text-slate-700 ml-1">
      {label} {required ? <span className="text-red-500">*</span> : null}
    </label>
    {children}
  </div>
);

const StatusBadge = ({ status }: { status?: string | null }) => {
  const s = (status || "ARCHIVED").toUpperCase();
  const cls =
    s === "ACTIVE"
      ? "bg-emerald-100 text-emerald-700"
      : s === "INACTIVE"
      ? "bg-amber-100 text-amber-700"
      : "bg-slate-100 text-slate-500";
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${cls}`}
    >
      {s}
    </span>
  );
};

const Confirm = ({
  open,
  title,
  desc,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  danger,
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  title: string;
  desc?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) => (
  <Modal open={open} title={title} onClose={onCancel}>
    <div className="space-y-4">
      {desc ? <div className="text-sm text-slate-600">{desc}</div> : null}
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="h-11 px-5 rounded-2xl bg-slate-100 font-black text-slate-700 hover:bg-slate-200 transition"
        >
          {cancelText}
        </button>
        <button
          disabled={loading}
          onClick={onConfirm}
          className={`h-11 px-6 rounded-2xl font-black text-white transition active:scale-[0.98] disabled:opacity-60 ${
            danger
              ? "bg-rose-600 hover:bg-rose-700"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Đang xử lý..." : confirmText}
        </button>
      </div>
    </div>
  </Modal>
);

function safeText(v: any) {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

export default function RestaurantOutletPage() {
  const vm = useRestaurantOutlet();

  const selectedRestaurant = useMemo(
    () => vm.restaurants.find((r) => r.id === vm.selectedRestaurantId) ?? null,
    [vm.restaurants, vm.selectedRestaurantId]
  );

  const selectedOutlet = useMemo(
    () => vm.outlets.find((o) => o.id === vm.selectedOutletId) ?? null,
    [vm.outlets, vm.selectedOutletId]
  );

  const [modal, setModal] = useState<{ type: ModalType; data: any }>({
    type: null,
    data: null,
  });

  const [formData, setFormData] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  const [confirm, setConfirm] = useState<{
    open: boolean;
    kind: "res_archive" | "out_archive" | null;
    id?: string;
    title?: string;
    desc?: string;
  }>({ open: false, kind: null });

  const isApplyDisabled =
    !vm.selectedRestaurantId || !vm.selectedOutletId || vm.loading;

  const closeModal = () => setModal({ type: null, data: null });

  const openResForm = (res?: Restaurant) => {
    setError(null);
    setFormData(
      res || {
        name: "",
        legalName: "",
        taxId: "",
        defaultCurrency: "VND",
        defaultTimezone: "Asia/Ho_Chi_Minh",
        locale: "vi-VN",
      }
    );
    setModal({ type: "res_form", data: res ?? null });
  };

  // --- trong openOutletForm ---
  const openOutletForm = (outlet?: Outlet) => {
    setError(null);
    setFormData(
      outlet || {
        name: "",
        code: "",
        phone: "",
        address: "",
        city: "",
        country: "VN",
        timezone: "Asia/Ho_Chi_Minh",
        openHours: null,
        isDefault: false,
        status: "ACTIVE",
      }
    );
    setModal({ type: "outlet_form", data: outlet ?? null });
  };

  const openResDetail = (res: Restaurant) =>
    setModal({ type: "res_detail", data: res });
  const openOutletDetail = (out: Outlet) =>
    setModal({ type: "outlet_detail", data: out });

  const onSaveRestaurant = async () => {
    setError(null);
    if (!formData?.name?.trim()) {
      setError("Tên nhà hàng không được để trống.");
      return;
    }
    try {
      if (modal.data?.id) await vm.updateRestaurant(modal.data.id, formData);
      else await vm.createRestaurant(formData);
      closeModal();
    } catch (e: any) {
      setError(e?.message || "Lưu nhà hàng thất bại");
    }
  };

  // --- trong onSaveOutlet ---
  const onSaveOutlet = async () => {
    setError(null);
    if (!vm.selectedRestaurantId) {
      setError("Vui lòng chọn nhà hàng trước khi tạo chi nhánh.");
      return;
    }
    if (!formData?.name?.trim()) {
      setError("Tên chi nhánh không được để trống.");
      return;
    }

    const payload = {
      ...formData,
      openHours: formData.openHours ?? null,
    };

    try {
      if (modal.data?.id) await vm.updateOutlet(modal.data.id, payload);
      else await vm.createOutlet(payload);
      closeModal();
    } catch (e: any) {
      setError(e?.message || "Lưu chi nhánh thất bại");
    }
  };

  const requestArchiveRestaurant = (id: string, name?: string | null) => {
    setConfirm({
      open: true,
      kind: "res_archive",
      id,
      title: "Archive nhà hàng",
      desc: `Bạn chắc chắn muốn archive nhà hàng ${
        name || ""
      }? Hành động này sẽ chuyển status sang ARCHIVED.`,
    });
  };

  const requestArchiveOutlet = (id: string, name?: string | null) => {
    setConfirm({
      open: true,
      kind: "out_archive",
      id,
      title: "Archive chi nhánh",
      desc: `Bạn chắc chắn muốn archive chi nhánh ${
        name || ""
      }? Hành động này sẽ chuyển status sang ARCHIVED.`,
    });
  };

  const runConfirm = async () => {
    if (!confirm.kind || !confirm.id) return;
    try {
      if (confirm.kind === "res_archive")
        await vm.archiveRestaurant(confirm.id);
      if (confirm.kind === "out_archive") await vm.archiveOutlet(confirm.id);
    } finally {
      setConfirm({ open: false, kind: null });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            Nhà hàng & Chi nhánh
          </div>
          <div className="text-sm text-slate-500 font-medium mt-1">
            Quản lý nhà hàng (restaurant) và chi nhánh (outlet), sau đó áp dụng
            ngữ cảnh để vận hành các module khác.
          </div>
        </div>
        <button
          onClick={vm.applyContext}
          disabled={isApplyDisabled}
          className={`h-11 px-6 rounded-2xl font-black transition active:scale-[0.98] ${
            isApplyDisabled
              ? "bg-slate-100 text-slate-300"
              : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20"
          }`}
        >
          Áp dụng ngữ cảnh
        </button>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Restaurants */}
        <section className="lg:col-span-5 bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[620px]">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3">
            <div>
              <div className="font-black text-slate-900 text-lg">Nhà hàng</div>
              <div className="text-xs text-slate-500 font-semibold">
                {vm.restaurants.length} nhà hàng
              </div>
            </div>
            <button
              onClick={() => openResForm()}
              disabled={!vm.canManageRestaurant}
              className="h-10 px-4 rounded-2xl bg-slate-900 text-white font-black text-sm hover:bg-slate-800 disabled:opacity-50 transition"
            >
              Thêm
            </button>
          </div>

          <div className="p-4 space-y-3 flex-1 overflow-y-auto">
            {vm.restaurants.map((r) => {
              const active = vm.selectedRestaurantId === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => vm.setSelectedRestaurantId(r.id)}
                  className={`group p-5 rounded-3xl border transition cursor-pointer relative ${
                    active
                      ? "bg-blue-50/60 border-blue-500 ring-1 ring-blue-500 shadow-md"
                      : "bg-white border-slate-100 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div
                        className={`font-black text-base truncate ${
                          active ? "text-blue-700" : "text-slate-900"
                        }`}
                      >
                        {safeText(r.name)}
                      </div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">
                        {safeText(r.legalName || r.taxId)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        className="h-9 px-3 rounded-xl text-slate-500 hover:text-blue-700 hover:bg-slate-50 font-black text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          openResDetail(r);
                        }}
                      >
                        Xem
                      </button>
                      <button
                        disabled={!vm.canManageRestaurant}
                        className="h-9 px-3 rounded-xl text-slate-500 hover:text-blue-700 hover:bg-slate-50 font-black text-xs disabled:opacity-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          openResForm(r);
                        }}
                      >
                        Sửa
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-600">
                    <StatusBadge status={r.status} />
                    <span className="truncate">
                      Locale: {safeText(r.locale)}
                    </span>
                    <span className="truncate">
                      TZ: {safeText(r.defaultTimezone)}
                    </span>
                    <span className="truncate">
                      Currency: {safeText(r.defaultCurrency)}
                    </span>
                  </div>

                  {active ? (
                    <div className="absolute top-4 right-4 text-blue-600 font-black">
                      ✓
                    </div>
                  ) : null}

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      disabled={!vm.canManageRestaurant}
                      className="h-9 px-3 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 font-black text-xs disabled:opacity-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        const next =
                          (r.status || "ACTIVE") === "ACTIVE"
                            ? "INACTIVE"
                            : "ACTIVE";
                        vm.toggleRestaurantStatus(r.id, next);
                      }}
                    >
                      Đổi trạng thái
                    </button>
                    <button
                      disabled={!vm.canManageRestaurant}
                      className="h-9 px-3 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-black text-xs disabled:opacity-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        requestArchiveRestaurant(r.id, r.name);
                      }}
                    >
                      Archive
                    </button>
                  </div>
                </div>
              );
            })}

            {!vm.restaurants.length ? (
              <div className="p-6 text-sm text-slate-500">
                Chưa có nhà hàng nào.
              </div>
            ) : null}
          </div>
        </section>

        {/* Right: Outlets */}
        <section className="lg:col-span-7 bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[620px]">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3">
            <div>
              <div className="font-black text-slate-900 text-lg">Chi nhánh</div>
              <div className="text-xs text-slate-500 font-semibold">
                {selectedRestaurant
                  ? `Thuộc: ${selectedRestaurant.name}`
                  : "Chọn nhà hàng để xem chi nhánh"}
              </div>
            </div>
            <button
              onClick={() => openOutletForm()}
              disabled={!vm.canManageOutlet || !vm.selectedRestaurantId}
              className="h-10 px-4 rounded-2xl bg-blue-600 text-white font-black text-sm hover:bg-blue-700 disabled:opacity-50 transition"
            >
              Thêm
            </button>
          </div>

          <div className="p-4 space-y-3 flex-1 overflow-y-auto">
            {!vm.selectedRestaurantId ? (
              <div className="p-10 text-center text-slate-400 font-semibold">
                Chọn một nhà hàng để xem danh sách chi nhánh.
              </div>
            ) : vm.outlets.length === 0 ? (
              <div className="p-10 text-center text-slate-400 font-semibold">
                Chưa có chi nhánh nào.
              </div>
            ) : (
              vm.outlets.map((o) => {
                const active = vm.selectedOutletId === o.id;
                return (
                  <div
                    key={o.id}
                    onClick={() => vm.setSelectedOutletId(o.id)}
                    className={`group p-5 rounded-3xl border transition cursor-pointer relative ${
                      active
                        ? "bg-blue-50 border-blue-500 shadow-md"
                        : "bg-white border-slate-100 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="font-black text-base text-slate-900 truncate">
                            {safeText(o.name)}
                          </div>
                          {o.isDefault ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-700">
                              default
                            </span>
                          ) : null}
                        </div>
                        <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest truncate">
                          {safeText(o.code)} • {safeText(o.phone)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          className="h-9 px-3 rounded-xl text-slate-500 hover:text-blue-700 hover:bg-slate-50 font-black text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            openOutletDetail(o);
                          }}
                        >
                          Xem
                        </button>
                        <button
                          disabled={!vm.canManageOutlet}
                          className="h-9 px-3 rounded-xl text-slate-500 hover:text-blue-700 hover:bg-slate-50 font-black text-xs disabled:opacity-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            openOutletForm(o);
                          }}
                        >
                          Sửa
                        </button>
                        <button
                          disabled={!vm.canManageOutlet}
                          className="h-9 px-3 rounded-xl text-rose-700 hover:bg-rose-50 font-black text-xs disabled:opacity-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            requestArchiveOutlet(o.id, o.name);
                          }}
                        >
                          Archive
                        </button>
                      </div>
                    </div>

                    <div className="text-sm text-slate-600 leading-relaxed mb-3">
                      {safeText(o.address)}
                      {o.city ? `, ${o.city}` : ""}
                      {o.country ? `, ${o.country}` : ""}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-600">
                      <StatusBadge status={o.status} />
                      <span className="truncate">
                        TZ: {safeText(o.timezone)}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        disabled={!vm.canManageOutlet}
                        className="h-9 px-3 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 font-black text-xs disabled:opacity-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          vm.makeDefaultOutlet(o.id);
                        }}
                      >
                        Đặt default
                      </button>
                    </div>

                    {active ? (
                      <div className="absolute top-4 right-4 text-blue-600 font-black">
                        ✓
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Restaurant Form */}
      <Modal
        open={modal.type === "res_form"}
        title={modal.data ? "Chỉnh sửa nhà hàng" : "Thêm nhà hàng"}
        onClose={closeModal}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField label="Tên nhà hàng" required>
            <input
              value={formData.name ?? ""}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full h-12 rounded-2xl border border-slate-200 px-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"
              placeholder="Ví dụ: Pho Anh Hai"
            />
          </FormField>

          <FormField label="Tên pháp lý">
            <input
              value={formData.legalName ?? ""}
              onChange={(e) =>
                setFormData({ ...formData, legalName: e.target.value })
              }
              className="w-full h-12 rounded-2xl border border-slate-200 px-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"
              placeholder="Ví dụ: Cong ty TNHH ..."
            />
          </FormField>

          <FormField label="Mã số thuế">
            <input
              value={formData.taxId ?? ""}
              onChange={(e) =>
                setFormData({ ...formData, taxId: e.target.value })
              }
              className="w-full h-12 rounded-2xl border border-slate-200 px-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"
              placeholder="Ví dụ: 0312345678"
            />
          </FormField>

          <FormField label="Tiền tệ mặc định" required>
            <input
              value={formData.defaultCurrency ?? "VND"}
              onChange={(e) =>
                setFormData({ ...formData, defaultCurrency: e.target.value })
              }
              className="w-full h-12 rounded-2xl border border-slate-200 px-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"
              placeholder="VND"
            />
          </FormField>

          <FormField label="Múi giờ mặc định" required>
            <input
              value={formData.defaultTimezone ?? "Asia/Ho_Chi_Minh"}
              onChange={(e) =>
                setFormData({ ...formData, defaultTimezone: e.target.value })
              }
              className="w-full h-12 rounded-2xl border border-slate-200 px-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"
              placeholder="Asia/Ho_Chi_Minh"
            />
          </FormField>

          <FormField label="Locale" required>
            <input
              value={formData.locale ?? "vi-VN"}
              onChange={(e) =>
                setFormData({ ...formData, locale: e.target.value })
              }
              className="w-full h-12 rounded-2xl border border-slate-200 px-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"
              placeholder="vi-VN"
            />
          </FormField>
        </div>

        {error ? (
          <div className="mt-4 text-sm font-semibold text-rose-600">
            {error}
          </div>
        ) : null}

        <div className="flex justify-end gap-3 mt-7">
          <button
            onClick={closeModal}
            className="h-11 px-5 rounded-2xl bg-slate-100 font-black text-slate-700 hover:bg-slate-200 transition"
          >
            Hủy
          </button>
          <button
            disabled={vm.loading || !String(formData.name || "").trim()}
            onClick={onSaveRestaurant}
            className="h-11 px-6 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 shadow-lg shadow-blue-500/20 disabled:opacity-50 transition active:scale-[0.98]"
          >
            {vm.loading ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </Modal>

      {/* Outlet Form */}
      <Modal
        open={modal.type === "outlet_form"}
        title={modal.data ? "Chỉnh sửa chi nhánh" : "Thêm chi nhánh"}
        onClose={closeModal}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField label="Tên chi nhánh" required>
            <input
              value={formData.name ?? ""}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full h-12 rounded-2xl border border-slate-200 px-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"
            />
          </FormField>

          <FormField label="Mã chi nhánh (code)">
            <input
              value={formData.code ?? ""}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
              className="w-full h-12 rounded-2xl border border-slate-200 px-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"
            />
          </FormField>

          <FormField label="Số điện thoại">
            <input
              value={formData.phone ?? ""}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full h-12 rounded-2xl border border-slate-200 px-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"
            />
          </FormField>

          <FormField label="Múi giờ">
            <input
              value={formData.timezone ?? "Asia/Ho_Chi_Minh"}
              onChange={(e) =>
                setFormData({ ...formData, timezone: e.target.value })
              }
              className="w-full h-12 rounded-2xl border border-slate-200 px-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"
            />
          </FormField>

          <div className="md:col-span-2">
            <FormField label="Địa chỉ">
              <input
                value={formData.address ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full h-12 rounded-2xl border border-slate-200 px-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"
                placeholder="Số nhà, đường, phường, quận..."
              />
            </FormField>
          </div>

          <FormField label="Thành phố">
            <input
              value={formData.city ?? ""}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
              className="w-full h-12 rounded-2xl border border-slate-200 px-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"
            />
          </FormField>

          <FormField label="Quốc gia">
            <input
              value={formData.country ?? "VN"}
              onChange={(e) =>
                setFormData({ ...formData, country: e.target.value })
              }
              className="w-full h-12 rounded-2xl border border-slate-200 px-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"
            />
          </FormField>

          {/* ✅ REPLACE JSON TEXTAREA -> FRIENDLY PICKER */}
          <div className="md:col-span-2">
            <FormField label="Giờ mở cửa">
              <OpenHoursPicker
                valueJson={formData.openHours ?? null}
                disabled={vm.loading}
                onChangeJson={(json) =>
                  setFormData((prev: any) => ({ ...prev, openHours: json }))
                }
              />
            </FormField>
          </div>

          <FormField label="Trạng thái">
            <select
              value={formData.status ?? "ACTIVE"}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className="w-full h-12 rounded-2xl border border-slate-200 px-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </FormField>

          <div className="md:col-span-2 flex items-center gap-3 p-4 bg-blue-50 rounded-2xl">
            <input
              type="checkbox"
              checked={Boolean(formData.isDefault)}
              onChange={(e) =>
                setFormData({ ...formData, isDefault: e.target.checked })
              }
              className="w-5 h-5 rounded"
            />
            <div className="text-sm font-black text-blue-900">
              Đặt làm chi nhánh mặc định
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-4 text-sm font-semibold text-rose-600">
            {error}
          </div>
        ) : null}

        <div className="flex justify-end gap-3 mt-7">
          <button
            onClick={closeModal}
            className="h-11 px-5 rounded-2xl bg-slate-100 font-black text-slate-700 hover:bg-slate-200 transition"
          >
            Hủy
          </button>
          <button
            disabled={vm.loading || !String(formData.name || "").trim()}
            onClick={onSaveOutlet}
            className="h-11 px-6 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 shadow-lg shadow-blue-500/20 disabled:opacity-50 transition active:scale-[0.98]"
          >
            {vm.loading ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </Modal>

      {/* Details */}
      <Modal
        open={modal.type === "res_detail"}
        title="Chi tiết nhà hàng"
        onClose={closeModal}
      >
        {modal.data ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              ["id", modal.data.id],
              ["name", modal.data.name],
              ["legalName", modal.data.legalName],
              ["taxId", modal.data.taxId],
              ["defaultCurrency", modal.data.defaultCurrency],
              ["defaultTimezone", modal.data.defaultTimezone],
              ["locale", modal.data.locale],
              ["status", modal.data.status],
              ["createdAt", modal.data.createdAt],
              ["updatedAt", modal.data.updatedAt],
            ].map(([k, v]) => (
              <div key={String(k)} className="p-4 bg-slate-50 rounded-2xl">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {k}
                </div>
                <div className="font-bold text-slate-800 truncate">
                  {safeText(v)}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={modal.type === "outlet_detail"}
        title="Chi tiết chi nhánh"
        onClose={closeModal}
      >
        {modal.data ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              ["id", modal.data.id],
              ["name", modal.data.name],
              ["code", modal.data.code],
              ["phone", modal.data.phone],
              ["address", modal.data.address],
              ["city", modal.data.city],
              ["country", modal.data.country],
              ["timezone", modal.data.timezone],
              ["openHours", modal.data.openHours],
              ["isDefault", String(Boolean(modal.data.isDefault))],
              ["status", modal.data.status],
              ["createdAt", modal.data.createdAt],
              ["updatedAt", modal.data.updatedAt],
            ].map(([k, v]) => (
              <div key={String(k)} className="p-4 bg-slate-50 rounded-2xl">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {k}
                </div>
                <div className="font-bold text-slate-800 truncate">
                  {safeText(v)}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </Modal>

      {/* Confirm */}
      <Confirm
        open={confirm.open}
        title={confirm.title || "Xác nhận"}
        desc={confirm.desc}
        danger
        onCancel={() => setConfirm({ open: false, kind: null })}
        onConfirm={runConfirm}
        loading={vm.loading}
        confirmText="Archive"
      />
    </div>
  );
}
