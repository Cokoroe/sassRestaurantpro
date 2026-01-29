// src/pages/app/kds/KdsPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  RefreshCw,
  Flame,
  CookingPot,
  CheckCircle2,
  Utensils,
  Clock,
  Filter,
} from "lucide-react";
import { kdsService } from "../../../api/services/kds.service";
import { useAppContextStore } from "../../../store/useAppContextStore";
import type { KdsBoardItem, KdsItemStatus } from "../../../types/kds";

const PRIMARY_COLUMNS: KdsItemStatus[] = ["FIRED", "IN_PROGRESS", "READY"];
const SECONDARY_COLUMNS: KdsItemStatus[] = ["NEW", "SERVED", "VOIDED"];

const fmtTime = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString();
};

const badgeClass = (st: KdsItemStatus) => {
  switch (st) {
    case "FIRED":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "READY":
      return "bg-green-100 text-green-700 border-green-200";
    case "SERVED":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "VOIDED":
      return "bg-red-100 text-red-700 border-red-200";
    case "NEW":
    default:
      return "bg-purple-100 text-purple-700 border-purple-200";
  }
};

const makeSinceIso = (hours: number) => {
  const d = new Date(Date.now() - hours * 60 * 60 * 1000);
  return d.toISOString();
};

// 🔔 Event names (cùng browser)
const EVT_KDS_CHANGED = "kds-changed";

export default function KdsPage() {
  const outletId = useAppContextStore((s) => s.outletId);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // filter UI (những status user đang bật)
  const [statuses, setStatuses] = useState<KdsItemStatus[]>([
    "FIRED",
    "IN_PROGRESS",
    "READY",
    "NEW",
  ]);

  const [sinceIso, setSinceIso] = useState<string>(() => makeSinceIso(6));
  const [items, setItems] = useState<KdsBoardItem[]>([]);
  const [showMore, setShowMore] = useState(false);

  // tránh overlapping fetch
  const inFlightRef = useRef(false);

  // ✅ status gửi lên API = status user bật
  // ✅ NHƯNG: nếu showMore bật thì include SERVED/VOIDED để cột đó có data
  const queryStatuses: KdsItemStatus[] = useMemo(() => {
    const base = new Set<KdsItemStatus>(statuses);

    // nếu user bật "Hiện thêm" thì tự query thêm
    if (showMore) {
      base.add("SERVED");
      base.add("VOIDED");
    }

    return Array.from(base);
  }, [statuses, showMore]);

  const fetchBoards = async (opts?: { silent?: boolean }) => {
    if (!outletId) {
      setItems([]);
      setError("Bạn chưa chọn outlet ở góc trên. Hãy chọn outlet trước.");
      return;
    }

    // avoid spam
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    if (!opts?.silent) {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await kdsService.boards({
        since: sinceIso || undefined,
        status: queryStatuses.length ? queryStatuses : undefined,
      });
      setItems(data.items ?? []);
    } catch (e: any) {
      console.error(e);
      setError(e?.response?.data?.message ?? "Không tải được KDS boards");
    } finally {
      inFlightRef.current = false;
      if (!opts?.silent) setLoading(false);
    }
  };

  // Load khi đổi outlet
  useEffect(() => {
    fetchBoards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outletId]);

  // ✅ Auto refresh (polling) + dừng khi tab ẩn
  useEffect(() => {
    if (!outletId) return;

    let t: any;

    const tick = async () => {
      // nếu tab đang ẩn thì skip
      if (document.hidden) return;
      await fetchBoards({ silent: true });
    };

    t = setInterval(tick, 3000); // 3s (bạn có thể đổi 2000/5000)
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outletId, sinceIso, queryStatuses.join("|")]);

  // ✅ Khi có event "kds-changed" (do KDS patch/served), tự refresh (silent)
  useEffect(() => {
    const onChanged = () => fetchBoards({ silent: true });
    window.addEventListener(EVT_KDS_CHANGED, onChanged);
    return () => window.removeEventListener(EVT_KDS_CHANGED, onChanged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outletId, sinceIso, queryStatuses.join("|")]);

  // sort by time asc (món cũ lên trước)
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const ta = new Date(a.itemCreatedAt).getTime();
      const tb = new Date(b.itemCreatedAt).getTime();
      return ta - tb;
    });
  }, [items]);

  const grouped = useMemo(() => {
    const map: Record<string, KdsBoardItem[]> = {};
    for (const it of sortedItems) {
      const k = it.itemStatus || "NEW";
      (map[k] ??= []).push(it);
    }
    return map;
  }, [sortedItems]);

  const toggleStatus = (st: KdsItemStatus) => {
    setStatuses((cur) =>
      cur.includes(st) ? cur.filter((x) => x !== st) : [...cur, st],
    );
  };

  const fireChanged = () => window.dispatchEvent(new Event(EVT_KDS_CHANGED));

  const patch = async (item: KdsBoardItem, target: "IN_PROGRESS" | "READY") => {
    setLoading(true);
    setError(null);
    try {
      await kdsService.patchItemStatus(item.itemId, { status: target });

      // refresh KDS + báo cho order page (cùng browser) refresh
      await fetchBoards({ silent: true });
      fireChanged();
    } catch (e: any) {
      console.error(e);
      setError(e?.response?.data?.message ?? "Cập nhật trạng thái thất bại");
    } finally {
      setLoading(false);
    }
  };

  const served = async (item: KdsBoardItem) => {
    setLoading(true);
    setError(null);
    try {
      await kdsService.markServed(item.orderId, item.itemId);

      // ✅ nếu muốn thấy món vừa served xuất hiện ngay trong cột SERVED
      // thì showMore phải bật (hoặc user bật SERVED filter). Ở đây ta refresh luôn.
      await fetchBoards({ silent: true });
      fireChanged();
    } catch (e: any) {
      console.error(e);
      setError(e?.response?.data?.message ?? "Mark served thất bại");
    } finally {
      setLoading(false);
    }
  };

  const renderActions = (it: KdsBoardItem) => {
    const st = it.itemStatus;

    return (
      <div className="flex flex-wrap gap-2 justify-end">
        {st === "FIRED" && (
          <>
            <button
              disabled={loading}
              onClick={() => patch(it, "IN_PROGRESS")}
              className="h-9 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold disabled:opacity-60"
              title="FIRED -> IN_PROGRESS"
            >
              <span className="inline-flex items-center gap-2">
                <CookingPot size={16} />
                Làm
              </span>
            </button>
            <button
              disabled={loading}
              onClick={() => patch(it, "READY")}
              className="h-9 px-3 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold disabled:opacity-60"
              title="FIRED -> READY"
            >
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={16} />
                Ready
              </span>
            </button>
          </>
        )}

        {st === "IN_PROGRESS" && (
          <button
            disabled={loading}
            onClick={() => patch(it, "READY")}
            className="h-9 px-3 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold disabled:opacity-60"
            title="IN_PROGRESS -> READY"
          >
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 size={16} />
              Ready
            </span>
          </button>
        )}

        {st === "READY" && (
          <button
            disabled={loading}
            onClick={() => served(it)}
            className="h-9 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold disabled:opacity-60"
            title="READY -> SERVED"
          >
            <span className="inline-flex items-center gap-2">
              <Utensils size={16} />
              Served
            </span>
          </button>
        )}
      </div>
    );
  };

  const renderCard = (it: KdsBoardItem) => (
    <div
      key={it.itemId}
      className="rounded-2xl border border-slate-100 bg-white shadow-sm p-4 space-y-2"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div
              className={[
                "h-7 px-2 rounded-lg border text-xs font-bold flex items-center",
                badgeClass(it.itemStatus),
              ].join(" ")}
            >
              {it.itemStatus}
            </div>

            {/* bạn có thể thay menuItemId bằng itemName nếu BE trả về */}
            <div className="text-sm font-bold text-slate-900 truncate">
              {it.menuItemName?.trim() ? it.menuItemName : it.menuItemId}
            </div>
          </div>

          <div className="mt-1 text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
            <span>
              <Clock size={14} className="inline -mt-0.5 mr-1" />
              {fmtTime(it.itemCreatedAt)}
            </span>
            <span>Order: {it.orderId}</span>
            {(it.tableName || it.tableId) && (
              <span>
                Table: {it.tableName?.trim() ? it.tableName : it.tableId}
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0">{renderActions(it)}</div>
      </div>

      <div className="text-sm text-slate-700 flex flex-wrap gap-x-4 gap-y-1">
        <span>
          Qty: <b className="text-slate-900">{it.quantity}</b>
        </span>
        <span>
          Unit: <b className="text-slate-900">{it.unitPrice}</b>
        </span>
        <span>
          Total: <b className="text-slate-900">{it.totalAmount}</b>
        </span>
      </div>

      {(it.note || it.orderNote) && (
        <div className="text-sm text-slate-700">
          {it.note && (
            <div className="line-clamp-2">
              <span className="font-semibold">Note món:</span> {it.note}
            </div>
          )}
          {it.orderNote && (
            <div className="line-clamp-2">
              <span className="font-semibold">Note order:</span> {it.orderNote}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderColumn = (col: KdsItemStatus) => {
    const list = grouped[col] ?? [];
    return (
      <div
        key={col}
        className="bg-slate-50 rounded-2xl border border-slate-100 p-3"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className={[
                "h-7 px-2 rounded-lg border text-xs font-bold flex items-center",
                badgeClass(col),
              ].join(" ")}
            >
              {col}
            </div>
            <div className="text-sm font-semibold text-slate-700">
              {list.length} món
            </div>
          </div>

          {col === "FIRED" && (
            <div className="text-xs text-slate-500 inline-flex items-center gap-2">
              <Flame size={14} /> ưu tiên
            </div>
          )}
        </div>

        <div className="space-y-3">
          {list.map(renderCard)}
          {list.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
              Trống
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">KDS (Bếp/Bar)</h1>
          <p className="text-sm text-slate-500">
            Luồng: NEW → FIRED → IN_PROGRESS/READY → SERVED
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Auto refresh mỗi 3s (dừng khi tab ẩn).
          </p>
        </div>

        <button
          onClick={() => fetchBoards()}
          disabled={loading}
          className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold inline-flex items-center gap-2 disabled:opacity-60"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          Tải lại
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div>
            <div className="text-xs font-semibold text-slate-500 mb-1">
              Outlet hiện tại
            </div>
            <div className="h-10 px-3 rounded-xl border border-slate-200 flex items-center text-sm text-slate-700 bg-slate-50">
              {outletId ?? "Chưa chọn outlet"}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-500 mb-1">
              Since (ISO)
            </div>
            <input
              value={sinceIso}
              onChange={(e) => setSinceIso(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="2026-01-15T10:00:00.000Z"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {[2, 6, 24].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setSinceIso(makeSinceIso(h))}
                  className="h-8 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold"
                >
                  {h}h gần nhất
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-2">
              <Filter size={14} /> Trạng thái (đang query)
            </div>

            <div className="flex flex-wrap gap-2">
              {[...PRIMARY_COLUMNS, "NEW" as const].map((st) => {
                const active = statuses.includes(st);
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => toggleStatus(st)}
                    className={[
                      "h-9 px-3 rounded-xl border text-sm font-semibold transition",
                      active
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    {st}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setShowMore((v) => !v)}
                className="h-9 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold"
              >
                {showMore ? "Ẩn thêm" : "Hiện thêm"}
              </button>

              {showMore &&
                (["SERVED", "VOIDED"] as KdsItemStatus[]).map((st) => {
                  const active = statuses.includes(st);
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => toggleStatus(st)}
                      className={[
                        "h-9 px-3 rounded-xl border text-sm font-semibold transition",
                        active
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      {st}
                    </button>
                  );
                })}
            </div>

            <div className="text-[11px] text-slate-400 mt-2">
              Query statuses:{" "}
              <span className="font-semibold">{queryStatuses.join(", ")}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Columns */}
      {!loading && items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center text-slate-500">
          Không có món nào phù hợp filter hiện tại.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {PRIMARY_COLUMNS.map(renderColumn)}
          </div>

          {/* secondary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {SECONDARY_COLUMNS.map(renderColumn)}
          </div>
        </>
      )}
    </div>
  );
}
