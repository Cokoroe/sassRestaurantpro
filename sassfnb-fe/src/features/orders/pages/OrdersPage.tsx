// src/pages/app/orders/OrdersPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  RefreshCcw,
  CreditCard,
  Eye,
  ClipboardList,
  Box,
  CheckCircle2,
} from "lucide-react";

import { useAppContextStore } from "../../../store/useAppContextStore";
import {
  orderService,
  type OrderSummary,
} from "../../../api/services/order.service";
import { money } from "../helpers/money";
import { canPayOrder } from "../helpers/orderStatus";
import { BillingTotalsModal } from "../../billing/components/BillingTotalsModal";
import { useTableLookup } from "../../../features/orders/hooks/useTableLookup";

function StatusBadge({ status }: { status: string }) {
  const s = (status ?? "").toUpperCase();

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
    label: s || "-",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${config.cls}`}
    >
      {config.label}
    </span>
  );
}

function computeDueDisplay(o: OrderSummary) {
  const status = (o.status ?? "").toUpperCase();

  const totalNum = Number(o.grandTotal ?? 0);
  const paidNum = Number(o.paidTotal ?? 0);

  // Nếu BE có dueTotal thì ưu tiên dùng
  const dueFromApi =
    o.dueTotal === null || o.dueTotal === undefined ? null : Number(o.dueTotal);

  // ✅ Rule quan trọng: PAID/CLOSED => due = 0 (không được suy ra còn nợ)
  if (status === "PAID" || status === "CLOSED") {
    return { totalNum, dueNum: 0, isPaid: true };
  }

  // Nếu BE trả dueTotal, dùng nó
  if (dueFromApi !== null && Number.isFinite(dueFromApi)) {
    return {
      totalNum,
      dueNum: Math.max(0, dueFromApi),
      isPaid: dueFromApi <= 0,
    };
  }

  // Nếu BE trả paidTotal mà có ý nghĩa, có thể suy ra due = total - paid
  if (o.paidTotal !== null && o.paidTotal !== undefined) {
    const due = Math.max(0, totalNum - paidNum);
    return { totalNum, dueNum: due, isPaid: due <= 0 };
  }

  // Không có dữ liệu due/paid => KHÔNG hiển thị "còn nợ"
  return { totalNum, dueNum: null as number | null, isPaid: false };
}

export default function OrdersPage() {
  const outletId = useAppContextStore((s) => s.outletId);
  const outletName = useAppContextStore((s) => s.outletName);

  const { getLabel: getTableLabel } = useTableLookup(outletId);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<OrderSummary[]>([]);

  const [billOpen, setBillOpen] = useState(false);
  const [billOrderId, setBillOrderId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const page = await orderService.list({
        outletId: outletId ?? undefined,
        q: q || undefined,
        status: status || undefined,
        page: 0,
        size: 50,
        sort: "updatedAt,desc",
      });

      setRows(page?.content ?? []);
    } catch (e: any) {
      setErr(
        e?.response?.data?.message ??
          e?.message ??
          "Không tải được danh sách orders.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outletId]);

  const filtered = useMemo(() => rows, [rows]);

  const openPay = (orderId: string) => {
    setBillOrderId(orderId);
    setBillOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700 max-w-[1600px] mx-auto pb-20 px-2 lg:px-0">
      {/* HEADER */}
      <div className="bg-white p-6 lg:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none group-hover:bg-blue-100 transition-colors duration-700" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
              <ClipboardList size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">
                Danh sách đơn hàng
              </h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
                Chi nhánh:{" "}
                <span className="text-blue-600">
                  {outletName || outletId || "Tất cả"}
                </span>
              </p>
            </div>
          </div>
        </div>

        <button
          className="relative z-10 h-12 px-6 bg-slate-50 text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 border border-slate-100 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          onClick={load}
          disabled={loading}
        >
          <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
          LÀM MỚI DỮ LIỆU
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[280px]">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
          />
          <input
            className="h-12 w-full rounded-2xl bg-slate-50 border-0 pl-11 pr-4 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-600/5 focus:bg-white transition-all placeholder:text-slate-300"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo mã đơn hoặc số bàn..."
          />
        </div>

        <div className="flex items-center gap-2 flex-1 md:flex-none">
          <select
            className="h-12 rounded-2xl bg-slate-50 border-0 px-4 text-xs font-black uppercase tracking-widest outline-none cursor-pointer hover:bg-slate-100 transition-colors min-w-[180px]"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">TẤT CẢ TRẠNG THÁI</option>
            <option value="OPEN">MỞ (OPEN)</option>
            <option value="SUBMITTED">ĐÃ GỬI (SUBMITTED)</option>
            <option value="IN_PROGRESS">ĐANG LÀM</option>
            <option value="READY">READY</option>
            <option value="SERVED">SERVED</option>
            <option value="PAID">ĐÃ THANH TOÁN</option>
            <option value="CLOSED">ĐÃ ĐÓNG</option>
            <option value="CANCELLED">ĐÃ HỦY</option>
            <option value="VOIDED">VOID</option>
          </select>

          <button
            className="h-12 px-8 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-60 shadow-lg shadow-slate-900/10"
            onClick={load}
            disabled={loading}
          >
            ÁP DỤNG
          </button>
        </div>

        {err && (
          <div className="w-full lg:w-auto px-4 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-xs font-black uppercase animate-pulse">
            {err}
          </div>
        )}
      </div>

      {/* TABLE / GRID */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
        {/* DESKTOP TABLE */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <th className="p-8">Mã Đơn / Phiên</th>
                <th className="p-8">Vị trí Bàn</th>
                <th className="p-8">Trạng thái</th>
                <th className="p-8 text-right">Tổng thanh toán / Due</th>
                <th className="p-8 text-right">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="p-8">
                      <div className="h-12 bg-slate-50 rounded-2xl w-full" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Box size={48} className="text-slate-100" />
                      <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em]">
                        CHƯA CÓ ĐƠN HÀNG NÀO
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((o) => {
                  const tableText = getTableLabel(o.tableId);
                  const { totalNum, dueNum, isPaid } = computeDueDisplay(o);

                  return (
                    <tr
                      key={o.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="p-8">
                        <div className="font-black text-slate-900 tracking-tight truncate max-w-[200px]">
                          {o.code ? o.code : o.id}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 tracking-widest mt-1 uppercase">
                          ID: {o.id.slice(0, 8)}...
                        </p>
                      </td>

                      <td className="p-8">
                        <div className="font-black text-slate-700 uppercase text-xs tracking-widest">
                          {tableText}
                        </div>
                      </td>

                      <td className="p-8">
                        <StatusBadge status={String(o.status ?? "")} />
                      </td>

                      <td className="p-8 text-right">
                        <div className="font-black text-sm text-slate-900">
                          {money(totalNum)}
                        </div>

                        {/* ✅ Hiển thị đúng nghiệp vụ */}
                        {isPaid ? (
                          <div className="mt-1 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                            <CheckCircle2 size={14} />
                            Đã thanh toán
                          </div>
                        ) : dueNum !== null && dueNum > 0 ? (
                          <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-1">
                            Còn nợ: {money(dueNum)}
                          </p>
                        ) : null}
                      </td>

                      <td className="p-8 text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/app/orders/${o.id}`}
                            className="h-10 px-4 flex items-center gap-2 rounded-xl bg-slate-50 text-slate-900 font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                          >
                            <Eye size={14} /> XEM CHI TIẾT
                          </Link>

                          <button
                            className="h-10 px-4 flex items-center gap-2 rounded-xl bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 disabled:opacity-20 transition-all shadow-lg shadow-blue-500/10 active:scale-95"
                            onClick={() => openPay(o.id)}
                            disabled={!canPayOrder(o.status)}
                          >
                            <CreditCard size={14} /> THANH TOÁN
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARDS */}
        <div className="lg:hidden p-4 space-y-4 bg-slate-50/50">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm"
              >
                <div className="h-20 bg-slate-50 rounded-2xl animate-pulse" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="p-24 text-center flex flex-col items-center gap-4 opacity-30">
              <Box size={48} />
              <p className="text-[11px] font-black uppercase tracking-[0.4em]">
                CHƯA CÓ ĐƠN HÀNG
              </p>
            </div>
          ) : (
            filtered.map((o) => {
              const { totalNum, dueNum, isPaid } = computeDueDisplay(o);
              const tableText = getTableLabel(o.tableId);

              return (
                <div
                  key={o.id}
                  className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4 animate-in zoom-in duration-500"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        ĐƠN: {o.code || o.id.slice(0, 8)}
                      </p>
                      <h3 className="text-xl font-black text-slate-900 uppercase">
                        Bàn: {tableText}
                      </h3>
                    </div>
                    <StatusBadge status={String(o.status ?? "")} />
                  </div>

                  <div className="flex justify-between items-end border-t border-slate-50 pt-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        TỔNG TIỀN
                      </p>
                      <p className="text-lg font-black text-blue-600">
                        {money(totalNum)}
                      </p>

                      {isPaid ? (
                        <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                          <CheckCircle2 size={14} />
                          Đã thanh toán
                        </div>
                      ) : dueNum !== null && dueNum > 0 ? (
                        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">
                          Còn nợ: {money(dueNum)}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex gap-2">
                      <Link
                        to={`/app/orders/${o.id}`}
                        className="w-12 h-12 bg-slate-100 text-slate-900 rounded-xl flex items-center justify-center"
                      >
                        <Eye size={20} />
                      </Link>

                      <button
                        onClick={() => openPay(o.id)}
                        disabled={!canPayOrder(o.status)}
                        className="h-12 px-6 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 disabled:opacity-20"
                      >
                        BILLING
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <BillingTotalsModal
        open={billOpen}
        onClose={() => setBillOpen(false)}
        scope="ORDER"
        orderId={billOrderId ?? undefined}
        outletId={outletId ?? undefined}
        title="Thanh toán đơn hàng"
        allowClose
        allowSepayPlaceholder
      />
    </div>
  );
}
