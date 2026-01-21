// src/pages/app/orders/OrderDetailPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  CreditCard,
  RefreshCcw,
  UtensilsCrossed,
  Info,
  Receipt,
  Box,
  CheckCircle2,
} from "lucide-react";

import {
  orderService,
  type OrderDetail,
} from "../../../api/services/order.service";
import { money } from "../helpers/money";
import { orderStatusLabel, canPayOrder } from "../helpers/orderStatus";
import { BillingTotalsModal } from "../../billing/components/BillingTotalsModal";
import { useAppContextStore } from "../../../store/useAppContextStore";
import { useTableLookup } from "../../../features/orders/hooks/useTableLookup";
import { useMenuItemLookup } from "../../../features/orders/hooks/useMenuItemLookup";

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;

  const s = status.toUpperCase();

  const configs: Record<string, { cls: string; label: string }> = {
    OPEN: { cls: "bg-blue-50 text-blue-700 border-blue-100", label: "MỞ" },
    SUBMITTED: {
      cls: "bg-indigo-50 text-indigo-700 border-indigo-100",
      label: "ĐÃ GỬI",
    },
    IN_PROGRESS: {
      cls: "bg-amber-50 text-amber-700 border-amber-100",
      label: "ĐANG LÀM",
    },
    READY: {
      cls: "bg-emerald-50 text-emerald-700 border-emerald-100",
      label: "CHỜ RA MÓN",
    },
    SERVED: {
      cls: "bg-slate-100 text-slate-600 border-slate-200",
      label: "ĐÃ PHỤC VỤ",
    },
    PAID: {
      cls: "bg-emerald-100 text-emerald-800 border-emerald-200",
      label: "ĐÃ THANH TOÁN",
    },
    CLOSED: {
      cls: "bg-slate-900 text-white border-slate-900",
      label: "ĐÃ ĐÓNG",
    },
    CANCELLED: {
      cls: "bg-rose-50 text-rose-700 border-rose-100",
      label: "ĐÃ HỦY",
    },
    VOIDED: {
      cls: "bg-rose-50 text-rose-700 border-rose-100",
      label: "VOID",
    },
  };

  const config = configs[s] || {
    cls: "bg-slate-50 text-slate-500 border-slate-100",
    label: s,
  };

  return (
    <span
      className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${config.cls}`}
    >
      {config.label}
    </span>
  );
}

export default function OrderDetailPage() {
  const { orderId = "" } = useParams();

  const outletId = useAppContextStore((s) => s.outletId);

  const { getLabel: getTableLabel } = useTableLookup(outletId);

  // ✅ lookup tên món theo menuItemId
  const { getName: getMenuItemName } = useMenuItemLookup(outletId);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderDetail | null>(null);

  const [billOpen, setBillOpen] = useState(false);

  const load = async () => {
    if (!orderId) return;
    setLoading(true);
    setErr(null);
    try {
      const data = await orderService.get(orderId);
      setOrder(data);
    } catch (e: any) {
      setErr(
        e?.response?.data?.message ?? e?.message ?? "Không tải được order.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const tableText = useMemo(() => {
    return getTableLabel(order?.tableId);
  }, [order?.tableId, getTableLabel]);

  const statusUpper = String(order?.status ?? "").toUpperCase();
  const isPaid = statusUpper === "PAID" || statusUpper === "CLOSED";

  const grandTotal = useMemo(() => {
    if (order?.grandTotal !== null && order?.grandTotal !== undefined) {
      return Number(order.grandTotal ?? 0);
    }
    const items = (order as any)?.items ?? [];
    return items.reduce(
      (acc: number, it: any) => acc + Number(it?.totalAmount ?? 0),
      0,
    );
  }, [order]);

  const totalQty = useMemo(() => {
    const items = (order as any)?.items ?? [];
    return items.reduce(
      (acc: number, it: any) => acc + Number(it?.quantity ?? 0),
      0,
    );
  }, [order]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700 max-w-[1400px] mx-auto pb-32 px-2 lg:px-0">
      {/* ACTION BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1 lg:px-0">
        <div className="space-y-1">
          <Link
            to="/app/orders"
            className="group inline-flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
              <ArrowLeft size={14} />
            </div>
            Quay lại danh sách đơn
          </Link>

          <div className="flex items-center gap-4 mt-2">
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">
              Chi tiết đơn
            </h1>
            <StatusBadge status={String(order?.status ?? "")} />
          </div>

          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Bàn: <span className="text-slate-700">{tableText}</span> • Trạng
            thái:{" "}
            <span className="text-slate-700">
              {orderStatusLabel(order?.status)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="h-12 px-6 bg-white border border-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            onClick={load}
            disabled={loading}
          >
            <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
            LÀM MỚI
          </button>

          <button
            className="h-12 px-10 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-30"
            onClick={() => setBillOpen(true)}
            disabled={!canPayOrder(order?.status)}
          >
            <CreditCard size={18} /> THANH TOÁN NGAY
          </button>
        </div>
      </div>

      {err && (
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-[2rem] flex items-center gap-4 animate-pulse">
          <Info size={24} className="text-rose-500" />
          <p className="text-xs font-black text-rose-900 tracking-widest uppercase leading-relaxed">
            {err}
          </p>
        </div>
      )}

      {/* SUMMARY DASHBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-white/10 rounded-2xl border border-white/5 text-blue-400">
                  <Receipt size={24} />
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                  HÓA ĐƠN TẠM TÍNH
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                  Mã định danh
                </p>
                <h3 className="text-xl font-black tracking-tight uppercase truncate">
                  {orderId ? orderId.slice(0, 12) : "---"}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-6">
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    Vị trí Bàn
                  </p>
                  <p className="text-sm font-black uppercase text-blue-400">
                    {tableText}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    Trạng thái
                  </p>
                  <p className="text-sm font-black uppercase">
                    {orderStatusLabel(order?.status)}
                  </p>
                </div>
              </div>

              <div className="bg-white/5 p-5 rounded-3xl border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase">
                    Tổng tiền hàng
                  </span>
                  <span className="text-sm font-bold">{money(grandTotal)}</span>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-1">
                  {isPaid ? (
                    <div className="w-full flex items-center justify-between text-emerald-300">
                      <span className="text-xs font-black uppercase tracking-widest">
                        Trạng thái thanh toán
                      </span>
                      <span className="inline-flex items-center gap-2 text-sm font-black uppercase">
                        <CheckCircle2 size={16} />
                        Đã thanh toán
                      </span>
                    </div>
                  ) : (
                    <div className="w-full flex items-center justify-between text-blue-400">
                      <span className="text-xs font-black uppercase tracking-widest">
                        Phải thanh toán
                      </span>
                      <span className="text-2xl font-black tracking-tighter">
                        {money(grandTotal)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="lg:col-span-8 bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
              <UtensilsCrossed size={18} className="text-blue-600" /> DANH MỤC
              MÓN ĐÃ GỌI
            </h2>
            <span className="text-[10px] font-black text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100 uppercase tracking-widest">
              SỐ LOẠI: {(order as any)?.items?.length || 0}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 bg-slate-50 rounded-[1.5rem] animate-pulse w-full"
                  />
                ))}
              </div>
            ) : !(order as any)?.items?.length ? (
              <div className="p-32 text-center flex flex-col items-center gap-4 opacity-20">
                <Box size={64} />
                <p className="text-[11px] font-black uppercase tracking-[0.4em]">
                  GIỎ MÓN TRỐNG
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {(order as any).items.map((it: any) => (
                  <div
                    key={it.id}
                    className="p-8 flex items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors group animate-in slide-in-from-right-4"
                  >
                    <div className="flex items-center gap-6 min-w-0">
                      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0 shadow-inner">
                        <UtensilsCrossed size={24} />
                      </div>

                      <div className="min-w-0">
                        <div className="font-black text-lg text-slate-900 tracking-tight truncate group-hover:text-blue-600 transition-colors">
                          {/* ✅ ưu tiên name từ BE, nếu không có thì lookup theo menuItemId */}
                          {it.name ?? getMenuItemName(it.menuItemId)}
                        </div>

                        <div className="flex items-center gap-3 mt-2">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-widest">
                            SL: {it.quantity}
                          </span>
                          <span className="w-1 h-1 bg-slate-200 rounded-full" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Trạng thái: {it.status ?? "-"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Thành tiền
                      </p>
                      <div className="font-black text-xl text-slate-900 tracking-tighter">
                        {money(it.totalAmount)}
                      </div>
                      <p className="text-[10px] font-bold text-slate-300 italic mt-1">
                        Đơn giá: {money(it.unitPrice)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* FOOTER TOTALS */}
          <div className="p-8 bg-slate-50/50 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                TỔNG MÓN
              </p>
              <p className="text-base font-black text-slate-900">{totalQty}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                PHỤ PHÍ / THUẾ
              </p>
              <p className="text-base font-black text-slate-900">0đ</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                GIẢM GIÁ
              </p>
              <p className="text-base font-black text-emerald-600">0đ</p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                {isPaid ? "ĐÃ THANH TOÁN" : "CẦN THANH TOÁN"}
              </p>
              <p
                className={`text-2xl font-black tracking-tighter ${
                  isPaid ? "text-emerald-600" : "text-blue-600"
                }`}
              >
                {money(isPaid ? 0 : grandTotal)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <BillingTotalsModal
        open={billOpen}
        onClose={() => setBillOpen(false)}
        scope="ORDER"
        orderId={orderId}
        outletId={outletId ?? undefined}
        title="Thanh toán đơn hàng"
        allowClose
        allowSepayPlaceholder
      />
    </div>
  );
}
