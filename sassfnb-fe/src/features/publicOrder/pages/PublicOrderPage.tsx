import { useEffect, useMemo, useState, type JSX, useRef } from "react";
import { useParams } from "react-router-dom";

import {
  Drawer,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Badge,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";

import {
  ChevronDown,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Check,
  Clock,
  ChefHat,
  CheckCircle2,
  X,
  Send,
  Loader2,
  UtensilsCrossed,
  Info,
  MapPin,
  CircleAlert,
  ListFilter,
} from "lucide-react";

import { publicOrderService } from "../../../api/services/publicOrder.service";
import { publicMenuService } from "../../../api/services/publicMenu.service";
import { publicQrService } from "../../../api/services/publicQr.service";
import { publicSession } from "../publicSession";

import type {
  PublicOrder,
  PublicAddItemRequest,
  PublicSelectedOptionRequest,
} from "../../../types/publicOrder";
import type {
  PublicMenuTreeResponse,
  PublicItemNode,
  PublicOptionNode,
  PublicOptionValueNode,
} from "../../../types/publicMenu";

/**
 * ===== Utils =====
 */
function money(n?: string | number | null) {
  const v = Number(n ?? 0);
  if (Number.isNaN(v)) return String(n ?? "0");
  return v.toLocaleString("vi-VN") + "đ";
}

const EVT_KDS_CHANGED = "kds-changed";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: JSX.Element }
> = {
  NEW: {
    label: "Mới",
    color: "bg-blue-50 text-blue-700 border-blue-100",
    icon: <Clock size={12} />,
  },
  FIRED: {
    label: "Chờ chế biến",
    color: "bg-indigo-50 text-indigo-700 border-indigo-100",
    icon: <Send size={12} />,
  },
  IN_PROGRESS: {
    label: "Đang làm",
    color: "bg-amber-50 text-amber-700 border-amber-100",
    icon: <ChefHat size={12} />,
  },
  READY: {
    label: "Chờ phục vụ",
    color: "bg-emerald-50 text-emerald-700 border-emerald-100",
    icon: <CheckCircle2 size={12} />,
  },
  SERVED: {
    label: "Đã ra món",
    color: "bg-slate-100 text-slate-600 border-slate-200",
    icon: <Check size={12} />,
  },
  VOIDED: {
    label: "Đã hủy",
    color: "bg-rose-50 text-rose-700 border-rose-100",
    icon: <X size={12} />,
  },
};

function StatusBadge({ status }: { status?: string | null }) {
  const s = String(status ?? "NEW").toUpperCase();
  const cfg = STATUS_CONFIG[s] ?? STATUS_CONFIG.NEW;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${cfg.color}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

export default function PublicOrderPage() {
  const { orderId = "" } = useParams();
  const ctx = publicSession.get();

  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [menu, setMenu] = useState<PublicMenuTreeResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selections, setSelections] = useState<
    Record<string, Record<string, string>>
  >({});
  const [qty, setQty] = useState<Record<string, number>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("");

  const loadOrder = async (opts?: { silent?: boolean }) => {
    if (!orderId) return;
    try {
      if (!opts?.silent) setLoadingOrder(true);
      const data = await publicOrderService.get(orderId);
      setOrder(data);
    } catch (e: any) {
      setErr(
        e?.response?.data?.message || e?.message || "Không tải được order.",
      );
    } finally {
      if (!opts?.silent) setLoadingOrder(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    const t = setInterval(() => {
      if (document.hidden) return;
      loadOrder({ silent: true });
    }, 3000);
    return () => clearInterval(t);
  }, [orderId]);

  useEffect(() => {
    const onChanged = () => loadOrder({ silent: true });
    window.addEventListener(EVT_KDS_CHANGED, onChanged);
    return () => window.removeEventListener(EVT_KDS_CHANGED, onChanged);
  }, [orderId]);

  useEffect(() => {
    if (!orderId && !ctx?.outletId) return;
    (async () => {
      try {
        setLoadingMenu(true);
        const data = await publicMenuService.tree({
          orderId: orderId || undefined,
          outletId: ctx?.outletId || undefined,
        });
        setMenu(data);
        if (data.categories?.length) setActiveTab(data.categories[0].id);
      } catch (e: any) {
        setErr(
          e?.response?.data?.message || e?.message || "Không tải được menu.",
        );
      } finally {
        setLoadingMenu(false);
      }
    })();
  }, [orderId, ctx?.outletId]);

  const scrollToCategory = (catId: string) => {
    setActiveTab(catId);
    const element = document.getElementById(`cat-${catId}`);
    if (element) {
      const offset = 140; // Header height offset
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const grandTotal = useMemo(() => order?.grandTotal ?? "0", [order]);

  const allItemsFlat: PublicItemNode[] = useMemo(() => {
    if (!menu?.categories?.length) return [];
    return menu.categories.flatMap((c) => c.items || []);
  }, [menu]);

  const menuItemById = useMemo(() => {
    const map = new Map<string, PublicItemNode>();
    for (const it of allItemsFlat) map.set(it.id, it);
    return map;
  }, [allItemsFlat]);

  const getSelectedValueId = (itemId: string, optionId: string) =>
    selections[itemId]?.[optionId] ?? "";

  const setSelectedValue = (
    itemId: string,
    optionId: string,
    valueId: string,
  ) => {
    setSelections((prev) => ({
      ...prev,
      [itemId]: { ...(prev[itemId] ?? {}), [optionId]: valueId },
    }));
  };

  const setItemQty = (itemId: string, n: number) => {
    const v = Math.max(1, n);
    setQty((prev) => ({ ...prev, [itemId]: v }));
  };

  const computeExtraPerUnit = (item: PublicItemNode) => {
    const map = selections[item.id] ?? {};
    let extra = 0;
    for (const opt of item.options ?? []) {
      const valId = map[opt.id];
      if (!valId) continue;
      const v = (opt.values ?? []).find((x) => x.id === valId);
      extra += Number(v?.extraPrice ?? 0);
    }
    return extra;
  };

  const validateRequired = (item: PublicItemNode) => {
    const map = selections[item.id] ?? {};
    for (const opt of item.options ?? []) {
      if (opt.required && !map[opt.id]) return `Vui lòng chọn "${opt.name}"`;
    }
    return null;
  };

  const addToCart = async (item: PublicItemNode) => {
    if (!order) return;
    setErr(null);
    const requiredErr = validateRequired(item);
    if (requiredErr) {
      setErr(requiredErr);
      return;
    }

    const map = selections[item.id] ?? {};
    const selectedOptions: PublicSelectedOptionRequest[] = Object.entries(map)
      .filter(([, valueId]) => !!valueId)
      .map(([optionId, valueId]) => ({ optionId, valueId }));

    const payload: PublicAddItemRequest = {
      menuItemId: item.id,
      quantity: qty[item.id] ?? 1,
      note: null,
      priceId: null,
      selectedOptions: selectedOptions.length ? selectedOptions : [],
    };

    try {
      setSubmitting(true);
      const next = await publicOrderService.addItems(order.id, [payload]);
      setOrder(next);
      setSelections((prev) => ({ ...prev, [item.id]: {} }));
      setQty((prev) => ({ ...prev, [item.id]: 1 }));
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || "Thêm món thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = async () => {
    if (!ctx?.outletId) {
      setErr("Mất ngữ cảnh chi nhánh. Vui lòng quét lại QR.");
      return;
    }
    if (!order) return;
    try {
      setSubmitting(true);
      await publicOrderService.submit(order.id, ctx.outletId);
      await loadOrder({ silent: true });
      window.dispatchEvent(new Event(EVT_KDS_CHANGED));
      setIsCartOpen(false);
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || "Gửi bếp thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const patchQty = async (itemId: string, nextQty: number) => {
    if (!order) return;
    try {
      setSubmitting(true);
      const next = await publicOrderService.patchItem(order.id, itemId, {
        quantity: Math.max(1, nextQty),
      });
      setOrder(next);
    } catch (e: any) {
      setErr("Lỗi cập nhật số lượng.");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!order) return;
    try {
      setSubmitting(true);
      const next = await publicOrderService.deleteItem(order.id, itemId);
      setOrder(next);
    } catch (e: any) {
      setErr("Xóa món thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderOptions = (item: PublicItemNode, options: PublicOptionNode[]) => {
    if (!options?.length) return null;
    return (
      <div className="mt-5 space-y-5">
        {options.map((opt) => {
          const valueId = getSelectedValueId(item.id, opt.id);
          return (
            <div key={opt.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  {opt.name}
                </p>
                {opt.required ? (
                  <span className="text-[9px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-black uppercase border border-rose-200">
                    Bắt buộc
                  </span>
                ) : (
                  <span className="text-[9px] text-slate-400 px-2 py-0.5 rounded-full font-black uppercase border border-slate-100 bg-white">
                    Tùy chọn
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(opt.values ?? []).map((v) => {
                  const checked = valueId === v.id;
                  return (
                    <label
                      key={v.id}
                      className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border cursor-pointer transition-all active:scale-[0.98] ${checked ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20" : "bg-slate-50 border-slate-100 hover:border-blue-200 text-slate-700"}`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          className="hidden"
                          name={`opt-${item.id}-${opt.id}`}
                          checked={checked}
                          onChange={() =>
                            setSelectedValue(item.id, opt.id, v.id)
                          }
                        />
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${checked ? "border-white" : "border-slate-300"}`}
                        >
                          {checked && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <span
                          className={`text-sm font-bold ${checked ? "text-white" : "text-slate-800"}`}
                        >
                          {v.name}
                        </span>
                      </div>
                      <span
                        className={`text-[11px] font-black ${checked ? "text-blue-100" : "text-slate-400"}`}
                      >
                        +{money(v.extraPrice)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const pageLoading = loadingOrder || loadingMenu;
  const tableLabel =
    ctx?.tableInfo?.name || ctx?.tableInfo?.code || ctx?.tableId || "---";
  const cartCount = order?.items?.length ?? 0;
  const canSubmit = Boolean(order) && cartCount > 0 && !submitting;

  if (!orderId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-slate-100 rounded-[2.5rem] p-10 text-center shadow-2xl">
          <div className="w-16 h-16 mx-auto bg-rose-50 rounded-[1.5rem] flex items-center justify-center text-rose-600">
            <CircleAlert size={32} />
          </div>
          <h2 className="mt-6 text-2xl font-black text-slate-900 uppercase tracking-tight">
            OrderId Missing
          </h2>
          <p className="mt-3 text-slate-500 font-medium">
            Vui lòng quét lại mã QR tại bàn để tiếp tục.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-32">
      <Snackbar
        open={!!err}
        autoHideDuration={4000}
        onClose={() => setErr(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity="error"
          variant="filled"
          sx={{ borderRadius: "1.2rem", fontWeight: 900 }}
        >
          {err}
        </Alert>
      </Snackbar>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-4 py-4 shadow-sm">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-[1.2rem] flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                <UtensilsCrossed size={24} />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 leading-tight uppercase tracking-tight">
                  Bàn {tableLabel}
                </h1>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <MapPin size={10} className="text-blue-500" />{" "}
                    {ctx?.outletId ? "Nhà hàng" : "Branch"}
                  </p>
                  <span className="w-1 h-1 bg-slate-200 rounded-full" />
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                    {order?.status || "Active"}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={onSubmit}
              disabled={!canSubmit}
              className="hidden sm:inline-flex items-center justify-center gap-3 h-12 px-8 rounded-2xl bg-slate-900 text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 hover:bg-blue-600 active:scale-95 disabled:opacity-20"
            >
              {submitting ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Send size={18} />
              )}{" "}
              {submitting ? "Processing..." : "Gửi đơn vào bếp"}
            </button>
          </div>

          {/* Mobile Category Horizontal Scroll */}
          <div className="flex lg:hidden overflow-x-auto gap-2 py-1 no-scrollbar -mx-2 px-2 border-t border-slate-50 pt-3">
            {menu?.categories?.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === cat.id ? "bg-blue-600 text-white shadow-lg" : "bg-white text-slate-400 border border-slate-100"}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Grid: Nav (2) | Menu (7) | Cart (3) */}
      <main className="max-w-[1500px] mx-auto px-4 pt-8 grid grid-cols-1 lg:grid-cols-[240px_1fr_360px] gap-10">
        {/* LEFT COLUMN: CATEGORY NAV (Desktop Only) */}
        <aside className="hidden lg:block sticky top-32 h-fit">
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-2 mb-6">
              <ListFilter size={20} className="text-blue-600" />
              <h2 className="font-black text-slate-900 uppercase text-xs tracking-[0.2em]">
                Danh mục
              </h2>
            </div>
            <div className="space-y-1">
              {menu?.categories?.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => scrollToCategory(cat.id)}
                  className={`w-full text-left p-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all group flex items-center justify-between ${activeTab === cat.id ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20 translate-x-1" : "bg-white border border-slate-50 text-slate-500 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-100"}`}
                >
                  {cat.name}
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-lg ${activeTab === cat.id ? "bg-white/20" : "bg-slate-50 text-slate-400 group-hover:bg-blue-50"}`}
                  >
                    {(cat.items ?? []).length}
                  </span>
                </button>
              ))}
            </div>
            {order?.note && (
              <div className="p-5 bg-blue-50/50 rounded-3xl border border-blue-100/50 italic text-[11px] text-blue-600 leading-relaxed">
                <Info size={16} className="mb-2" /> Ghi chú từ quản lý:{" "}
                {order.note}
              </div>
            )}
          </div>
        </aside>

        {/* MIDDLE COLUMN: MENU */}
        <section className="space-y-12">
          {pageLoading ? (
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-20 flex flex-col items-center justify-center gap-6 text-slate-400">
              <CircularProgress
                size={40}
                thickness={5}
                sx={{ color: "#2563eb" }}
              />
              <span className="font-black text-xs uppercase tracking-[0.4em] animate-pulse">
                SassFnB Loading...
              </span>
            </div>
          ) : (
            <div className="space-y-10">
              {menu?.categories?.map((cat) => (
                <div
                  key={cat.id}
                  id={`cat-${cat.id}`}
                  className="scroll-mt-32 animate-in fade-in duration-700"
                >
                  <div className="flex items-center gap-4 mb-8">
                    <h3 className="font-black text-slate-900 uppercase text-lg tracking-widest whitespace-nowrap bg-white px-6 py-2 rounded-2xl border border-slate-100 shadow-sm">
                      {cat.name}
                    </h3>
                    <div className="h-px flex-1 bg-slate-100" />
                  </div>

                  <div className="flex flex-col gap-6">
                    {(cat.items ?? []).map((item) => {
                      const extra = computeExtraPerUnit(item);
                      const unitPrice = Number(item.basePrice ?? 0) + extra;
                      const currentQty = qty[item.id] ?? 1;

                      return (
                        <div
                          key={item.id}
                          className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col hover:shadow-xl hover:border-blue-100 transition-all duration-500 group"
                        >
                          <div className="flex flex-col md:flex-row">
                            {item.imageUrl && (
                              <div className="md:w-[260px] h-[200px] md:h-auto overflow-hidden relative shrink-0">
                                <img
                                  src={item.imageUrl}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                                  alt={item.name}
                                  loading="lazy"
                                />
                                <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md px-4 py-1.5 rounded-full text-[11px] font-black text-white shadow-xl border border-white/20">
                                  {money(item.basePrice)}
                                </div>
                              </div>
                            )}

                            <div className="p-8 flex-1 flex flex-col">
                              <div className="space-y-2">
                                <div className="flex items-start justify-between gap-4">
                                  <h4 className="font-black text-slate-900 text-2xl tracking-tight leading-tight">
                                    {item.name}
                                  </h4>
                                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                    {money(unitPrice)}
                                  </span>
                                </div>
                                {item.description && (
                                  <p className="text-sm text-slate-500 leading-relaxed max-w-2xl font-medium">
                                    {item.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-3 pt-2">
                                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                    Gốc: {money(item.basePrice)}
                                  </span>
                                  {extra > 0 && (
                                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                                      + Phụ phí: {money(extra)}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {renderOptions(item, item.options ?? [])}

                              <div className="pt-8 mt-6 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-6">
                                <div className="flex items-center bg-slate-100 rounded-2xl p-1.5 shadow-inner">
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      setItemQty(item.id, currentQty - 1)
                                    }
                                    disabled={submitting}
                                    className="h-10 w-10 text-slate-500 bg-white hover:bg-slate-50 shadow-sm border border-slate-200"
                                  >
                                    <Minus size={16} />
                                  </IconButton>
                                  <input
                                    value={currentQty}
                                    onChange={(e) =>
                                      setItemQty(
                                        item.id,
                                        Number(e.target.value || 1),
                                      )
                                    }
                                    className="w-16 bg-transparent text-center text-lg font-black text-slate-800 outline-none"
                                    inputMode="numeric"
                                  />
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      setItemQty(item.id, currentQty + 1)
                                    }
                                    disabled={submitting}
                                    className="h-10 w-10 text-slate-500 bg-white hover:bg-slate-50 shadow-sm border border-slate-200"
                                  >
                                    <Plus size={16} />
                                  </IconButton>
                                </div>
                                <button
                                  disabled={submitting}
                                  onClick={() => addToCart(item)}
                                  className="w-full sm:w-auto h-14 px-12 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-600 transition-all active:scale-[0.97] shadow-2xl shadow-slate-900/10 flex items-center justify-center gap-3 disabled:opacity-20"
                                >
                                  <ShoppingBag size={18} /> Thêm (
                                  {money(unitPrice * currentQty)})
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* RIGHT COLUMN: CART (Desktop Only) */}
        <aside className="hidden lg:block sticky top-32 h-fit">
          <CartPanel
            order={order}
            menuItemById={menuItemById}
            onSubmit={onSubmit}
            submitting={submitting}
            grandTotal={grandTotal}
            patchQty={patchQty}
            deleteItem={deleteItem}
          />
        </aside>
      </main>

      {/* Mobile Sticky Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-5 animate-in slide-in-from-bottom-5">
        <div className="bg-slate-900 text-white p-5 rounded-[2.5rem] flex items-center justify-between shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] border border-white/10 active:scale-[0.98] transition-all">
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-5 text-left"
          >
            <Badge
              badgeContent={cartCount}
              color="primary"
              sx={{
                "& .MuiBadge-badge": {
                  backgroundColor: "#2563eb",
                  color: "white",
                  fontWeight: 900,
                  border: "2px solid #0f172a",
                },
              }}
            >
              <div className="w-14 h-14 bg-white/10 rounded-[1.2rem] flex items-center justify-center border border-white/20 shadow-inner">
                <ShoppingBag size={28} />
              </div>
            </Badge>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Tạm tính
              </p>
              <p className="text-2xl font-black">{money(grandTotal)}</p>
            </div>
          </button>
          <button
            onClick={() => setIsCartOpen(true)}
            className="h-14 px-8 bg-blue-600 text-white rounded-[1.2rem] font-black text-xs uppercase tracking-[0.15em] shadow-xl shadow-blue-600/30"
          >
            Xem giỏ
          </button>
        </div>
      </div>

      {/* Mobile Drawer (Cart Detail) */}
      <Drawer
        anchor="bottom"
        open={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: "2.5rem",
            borderTopRightRadius: "2.5rem",
            maxHeight: "90vh",
            backgroundColor: "#f8fafc",
          },
        }}
      >
        <div className="p-8 flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between mb-8 shrink-0">
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                Chi tiết giỏ món
              </h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
                Order Review System
              </p>
            </div>
            <IconButton
              onClick={() => setIsCartOpen(false)}
              className="bg-white border border-slate-100 shadow-sm rounded-2xl h-12 w-12"
            >
              <X size={24} className="text-slate-900" />
            </IconButton>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
            <CartPanel
              order={order}
              menuItemById={menuItemById}
              onSubmit={onSubmit}
              submitting={submitting}
              grandTotal={grandTotal}
              patchQty={patchQty}
              deleteItem={deleteItem}
            />
          </div>
        </div>
      </Drawer>
    </div>
  );
}

/**
 * REUSABLE CART PANEL
 */
function CartPanel(props: {
  order: PublicOrder | null;
  menuItemById: Map<string, PublicItemNode>;
  onSubmit: () => void;
  submitting: boolean;
  grandTotal: string | number;
  patchQty: (itemId: string, nextQty: number) => void;
  deleteItem: (itemId: string) => void;
}) {
  const {
    order,
    menuItemById,
    onSubmit,
    submitting,
    grandTotal,
    patchQty,
    deleteItem,
  } = props;
  const items = order?.items ?? [];
  const newItems = items.filter(
    (x) => String(x.status ?? "").toUpperCase() === "NEW",
  );
  const sentItems = items.filter(
    (x) => String(x.status ?? "").toUpperCase() !== "NEW",
  );
  const canSubmit = Boolean(order) && items.length > 0 && !submitting;

  return (
    <div className="flex flex-col gap-10">
      <div className="space-y-6">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Món đã gửi
          ({sentItems.length})
        </h3>
        {sentItems.length === 0 ? (
          <div className="p-8 bg-white/50 border border-dashed border-slate-200 rounded-[2.5rem] text-center opacity-40">
            <p className="text-[10px] font-black uppercase tracking-widest">
              Chưa có món nào được thực hiện
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sentItems.map((x) => {
              const menuItem = menuItemById.get(x.menuItemId);
              const name = menuItem?.name || `Món #${x.menuItemId}`;
              return (
                <div
                  key={x.id}
                  className="p-5 bg-white border border-slate-100 rounded-[1.5rem] flex items-start justify-between gap-4 shadow-sm group"
                >
                  <div className="min-w-0 space-y-2">
                    <p className="font-black text-slate-900 text-sm truncate group-hover:text-blue-600 transition-colors">
                      {name}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black text-blue-700 bg-blue-50 px-2 py-1 rounded uppercase tracking-tighter border border-blue-100">
                        x{x.quantity}
                      </span>
                      <StatusBadge status={x.status} />
                    </div>
                  </div>
                  <p className="text-sm font-black text-slate-700 shrink-0">
                    {money(x.totalAmount)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-6 pt-10 border-t border-slate-100">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />{" "}
          Giỏ món mới ({newItems.length})
        </h3>
        {newItems.length === 0 ? (
          <div className="p-12 bg-blue-50/50 border border-dashed border-blue-200 rounded-[2.5rem] text-center">
            <UtensilsCrossed size={32} className="mx-auto text-blue-200 mb-4" />
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
              Chưa có món mới nào
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {newItems.map((x) => {
              const menuItem = menuItemById.get(x.menuItemId);
              const name = menuItem?.name || `Món #${x.menuItemId}`;
              return (
                <div
                  key={x.id}
                  className="p-6 bg-white border border-blue-100 rounded-[2rem] flex flex-col gap-5 shadow-xl shadow-blue-500/5 animate-in slide-in-from-right-2"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-black text-slate-900 text-lg leading-tight truncate">
                        {name}
                      </p>
                      <p className="text-[11px] font-black text-blue-500 uppercase tracking-widest mt-1">
                        Pending Send
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-black text-slate-900">
                        {money(x.totalAmount)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => patchQty(x.id, x.quantity - 1)}
                        disabled={submitting}
                        className="h-10 w-10 rounded-xl bg-slate-100 text-slate-900 font-black flex items-center justify-center hover:bg-slate-200 active:scale-95 disabled:opacity-30"
                      >
                        <Minus size={16} />
                      </button>
                      <div className="h-10 px-5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                        <span className="text-base font-black text-slate-800">
                          {x.quantity}
                        </span>
                      </div>
                      <button
                        onClick={() => patchQty(x.id, x.quantity + 1)}
                        disabled={submitting}
                        className="h-10 w-10 rounded-xl bg-slate-100 text-slate-900 font-black flex items-center justify-center hover:bg-slate-200 active:scale-95 disabled:opacity-30"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <button
                      onClick={() => deleteItem(x.id)}
                      disabled={submitting}
                      className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-all disabled:opacity-20 active:scale-90"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-10 space-y-6">
        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-3 shadow-inner">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-black uppercase tracking-widest">
              Tạm tính
            </span>
            <span className="text-sm font-black">{money(grandTotal)}</span>
          </div>
          <div className="flex items-center justify-between text-slate-900">
            <span className="text-sm font-black uppercase tracking-widest">
              Thành tiền
            </span>
            <span className="text-3xl font-black tracking-tighter">
              {money(grandTotal)}
            </span>
          </div>
        </div>
        <button
          disabled={!canSubmit}
          onClick={onSubmit}
          className="w-full h-16 bg-slate-900 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-slate-900/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-20 flex items-center justify-center gap-4 group"
        >
          {submitting ? (
            <Loader2 className="animate-spin" size={24} />
          ) : (
            <Send
              size={24}
              className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
            />
          )}{" "}
          {submitting ? "ĐANG GỬI..." : "XÁC NHẬN ĐẶT MÓN"}
        </button>
        <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed px-4">
          * Đơn hàng sẽ được gửi trực tiếp xuống bếp ngay lập tức.
        </p>
      </div>
    </div>
  );
}
