import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  RefreshCw,
  Receipt,
  CreditCard,
  Banknote,
  QrCode,
  Info,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import type {
  BillingScope,
  BillingTotalsResponse,
  SepayQrResponse,
  UUID,
} from "../../../types/billing";
import { billingService } from "../../../api/services/billing.service";

type ManualPaymentMethod = "CASH" | "TRANSFER";

type Props = {
  open: boolean;
  onClose: () => void;
  scope: BillingScope;
  orderId?: UUID;
  groupId?: UUID;
  outletId?: UUID;
  title?: string;
  allowClose?: boolean;
  allowSepayPlaceholder?: boolean;
};

const toNumber = (v: unknown): number => {
  if (v === null || v === undefined) return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

const fmtMoney = (v: unknown) =>
  toNumber(v).toLocaleString("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

export const BillingTotalsModal: React.FC<Props> = ({
  open,
  onClose,
  scope,
  orderId,
  groupId,
  outletId,
  title,
  allowClose = true,
  allowSepayPlaceholder = true,
}) => {
  // ====== LOGIC CŨ (GIỮ NGUYÊN) ======
  const [loading, setLoading] = useState(false);
  const [totals, setTotals] = useState<BillingTotalsResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [payMethod, setPayMethod] = useState<ManualPaymentMethod>("CASH");
  const [payAmount, setPayAmount] = useState<string>("");
  const [payNote, setPayNote] = useState<string>("");

  const [sepayLoading, setSepayLoading] = useState(false);
  const [sepay, setSepay] = useState<SepayQrResponse | null>(null);

  const keyOk = useMemo(() => {
    if (scope === "ORDER") return Boolean(orderId);
    return Boolean(groupId);
  }, [scope, orderId, groupId]);

  const refresh = async () => {
    if (!keyOk) return;
    setLoading(true);
    setErr(null);
    try {
      const data = await billingService.totals(scope, {
        orderId: scope === "ORDER" ? orderId : undefined,
        groupId: scope === "GROUP" ? groupId : undefined,
      });
      setTotals(data);
    } catch (e: any) {
      setErr(
        e?.response?.data?.message ?? e?.message ?? "Failed to load totals",
      );
      setTotals(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setPayMethod("CASH");
    setPayAmount("");
    setPayNote("");
    setSepay(null);
    setSepayLoading(false);
    refresh();
  }, [open, scope, orderId, groupId]);

  const due = toNumber(totals?.dueTotal);

  const onPay = async () => {
    if (!keyOk) return;
    setErr(null);
    const amountNum = Number(payAmount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setErr("Số tiền không hợp lệ");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        method: payMethod,
        amount: amountNum,
        note: payNote?.trim() ? payNote.trim() : null,
        receivedAt: new Date().toISOString(),
      };
      if (scope === "ORDER")
        await billingService.manualPayOrder(orderId!, payload);
      else await billingService.manualPayGroup(groupId!, payload);
      await refresh();
      setPayAmount("");
      setPayNote("");
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? e?.message ?? "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const onCloseBill = async () => {
    if (!keyOk) return;
    setErr(null);
    setLoading(true);
    try {
      if (scope === "ORDER") await billingService.closeOrder(orderId!);
      else await billingService.closeGroup(groupId!);
      await refresh();
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? e?.message ?? "Close failed");
    } finally {
      setLoading(false);
    }
  };

  const canGenSepayQr =
    scope === "ORDER" && Boolean(orderId) && Boolean(outletId) && due > 0;

  const onGenSepayQr = async () => {
    if (!canGenSepayQr) {
      setErr("Thiếu outletId hoặc orderId, hoặc Due = 0.");
      return;
    }
    setErr(null);
    setSepayLoading(true);
    try {
      const res = await billingService.sepayQrOrder(orderId!, outletId!);
      setSepay(res);
    } catch (e: any) {
      setErr(
        e?.response?.data?.message ?? e?.message ?? "Tạo QR SePay thất bại",
      );
      setSepay(null);
    } finally {
      setSepayLoading(false);
    }
  };

  if (!open) return null;

  const modalTitle =
    title ?? (scope === "ORDER" ? "Thanh toán đơn" : "Thanh toán nhóm");
  const idShort =
    (scope === "ORDER" ? orderId : groupId)?.slice(0, 8) ?? "--------";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in duration-300"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-[960px] max-h-[95vh] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-200 border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* LEFT: SUMMARY - Trên Mobile nó sẽ chiếm 1 phần rồi cuộn tiếp xuống dưới */}
        <div className="w-full md:w-[360px] lg:w-[400px] bg-slate-900 text-white p-6 lg:p-10 flex flex-col relative shrink-0 overflow-y-auto md:overflow-y-auto custom-scrollbar border-b md:border-b-0 md:border-r border-white/5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner text-blue-400 shrink-0">
                <Receipt size={24} />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-black uppercase tracking-tight leading-none truncate">
                  {modalTitle}
                </h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate mt-1.5 opacity-70">
                  {scope} • #{idShort}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2.5">
                <BillRow label="Tạm tính" value={fmtMoney(totals?.subTotal)} />
                <BillRow
                  label="Giảm giá"
                  value={fmtMoney(totals?.discountTotal)}
                  isDiscount
                />
                <BillRow
                  label="Phí dịch vụ"
                  value={fmtMoney(totals?.serviceCharge)}
                />
                <BillRow label="Thuế VAT" value={fmtMoney(totals?.tax)} />
              </div>

              <div className="py-6 border-t border-white/5 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    Tổng cộng
                  </span>
                  <span className="text-3xl font-black tracking-tighter text-blue-400">
                    {fmtMoney(totals?.grandTotal)}đ
                  </span>
                </div>

                <div className="p-5 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                  <div className="flex items-center justify-between text-emerald-400">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        Đã thu
                      </span>
                    </div>
                    <span className="text-sm font-black">
                      {fmtMoney(totals?.paidTotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-rose-400 border-t border-white/5 pt-4">
                    <div className="flex items-center gap-2">
                      <Wallet size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        Còn nợ
                      </span>
                    </div>
                    <span className="text-xl font-black">
                      {fmtMoney(totals?.dueTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={refresh}
              disabled={loading || !keyOk}
              className="mt-8 md:mt-auto h-12 w-full bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 border border-white/5 transition-all active:scale-95 disabled:opacity-30 shrink-0"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              {loading ? "ĐANG TẢI..." : "CẬP NHẬT SỐ LIỆU"}
            </button>
          </div>
        </div>

        {/* RIGHT: ACTIONS - Phần này trên mobile sẽ cuộn tiếp ngay sau phần Summary */}
        <div className="flex-1 flex flex-col min-h-0 bg-slate-50 overflow-hidden">
          {/* Header Action Bar - Sticky top of right side */}
          <div className="flex items-center justify-between px-6 lg:px-10 py-4 border-b border-slate-200 bg-white/80 backdrop-blur-md shrink-0 sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                <CreditCard size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                Thanh toán
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-xl text-slate-400 hover:text-rose-600 transition-all active:scale-90"
              aria-label="Đóng"
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable Content area */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar space-y-8">
            {err && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-600 animate-in slide-in-from-top-2">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p className="text-xs font-bold leading-relaxed">{err}</p>
              </div>
            )}

            {/* MANUAL FORM */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-2">
                <Banknote size={16} className="text-emerald-500" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Ghi nhận thu tiền mặt/CK
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                    Hình thức
                  </label>
                  <select
                    className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 text-xs font-black uppercase outline-none focus:ring-4 focus:ring-blue-600/5 transition-all"
                    value={payMethod}
                    onChange={(e) =>
                      setPayMethod(e.target.value as ManualPaymentMethod)
                    }
                    disabled={loading || sepayLoading}
                  >
                    <option value="CASH">TIỀN MẶT</option>
                    <option value="TRANSFER">CHUYỂN KHOẢN</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                    Số tiền
                  </label>
                  <input
                    className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 text-sm font-black outline-none focus:ring-4 focus:ring-blue-600/5 transition-all"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder={totals ? `Tối đa: ${fmtMoney(due)}` : "0"}
                    inputMode="decimal"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                  Ghi chú
                </label>
                <textarea
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-medium outline-none focus:ring-4 focus:ring-blue-600/5 transition-all"
                  rows={2}
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="Nội dung ghi chú..."
                />
              </div>

              <button
                onClick={onPay}
                disabled={loading || sepayLoading || !totals || due <= 0}
                className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-20 flex items-center justify-center gap-3 shadow-xl shadow-slate-900/10"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Wallet size={18} />
                )}
                {loading ? "ĐANG XỬ LÝ..." : "XÁC NHẬN THU TIỀN"}
              </button>
            </div>

            {/* SEPAY QR */}
            {allowSepayPlaceholder && (
              <div className="bg-white p-6 rounded-[2rem] border border-blue-100 shadow-sm space-y-6 relative overflow-hidden group/sepay">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full blur-2xl -mr-12 -mt-12 pointer-events-none group-hover/sepay:bg-blue-100 transition-colors" />

                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <QrCode size={16} className="text-blue-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Tự động qua SePay QR
                    </span>
                  </div>

                  {scope === "GROUP" ? (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                        Chưa hỗ trợ tạo QR cho nhóm.
                        <br />
                        Vui lòng thanh toán từng đơn.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {!sepay && (
                        <button
                          onClick={onGenSepayQr}
                          disabled={!canGenSepayQr || sepayLoading}
                          className="w-full h-14 bg-blue-50 text-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-blue-100 hover:bg-blue-100 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3"
                        >
                          {sepayLoading ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <QrCode size={16} />
                          )}
                          TẠO MÃ QR THANH TOÁN
                        </button>
                      )}

                      {sepay && (
                        <div className="animate-in fade-in zoom-in-95 duration-500 space-y-4">
                          <div className="flex flex-col items-center bg-slate-50 rounded-[2.5rem] p-6 border border-slate-200 shadow-inner">
                            <div className="w-48 h-48 bg-white p-3 rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-4">
                              <img
                                src={sepay.qrImageUrl}
                                alt="SePay QR"
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="text-center space-y-1">
                              <p className="text-xl font-black text-slate-900 tracking-tight">
                                {fmtMoney(sepay.amount)} đ
                              </p>
                              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                                Nội dung: {sepay.paymentCode}
                              </p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-2">
                                {sepay.bank} • {sepay.acc}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setSepay(null)}
                            className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-500 transition-colors"
                          >
                            HỦY MÃ QR NÀY
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* FINALIZE BUTTON */}
            {allowClose && (
              <div className="pt-2 pb-10">
                <button
                  onClick={onCloseBill}
                  disabled={
                    loading ||
                    sepayLoading ||
                    !totals ||
                    toNumber(totals?.dueTotal) !== 0
                  }
                  className="w-full h-16 bg-emerald-600 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-[0.3em] shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-20 flex items-center justify-center gap-4 group"
                >
                  {toNumber(totals?.dueTotal) === 0 ? (
                    <CheckCircle2
                      size={24}
                      className="group-hover:scale-110 transition-transform"
                    />
                  ) : (
                    <Info size={24} />
                  )}
                  {toNumber(totals?.dueTotal) === 0
                    ? "HOÀN TẤT & ĐÓNG ĐƠN"
                    : "DUE PHẢI = 0 ĐỂ ĐÓNG"}
                </button>
                <p className="mt-4 text-center text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-relaxed">
                  * Lưu ý: Hệ thống chỉ cho phép đóng phiên khi nợ đã được tất
                  toán (Due = 0).
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const BillRow = ({
  label,
  value,
  isDiscount,
}: {
  label: string;
  value: string;
  isDiscount?: boolean;
}) => {
  const numeric = Number(String(value).replace(/[^0-9.-]/g, "")) || 0;
  return (
    <div className="flex items-center justify-between">
      <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
        {label}
      </div>
      <div
        className={`text-sm font-bold ${isDiscount ? "text-rose-400" : "text-slate-300"}`}
      >
        {isDiscount && numeric > 0 ? `-${value}` : value}
      </div>
    </div>
  );
};
