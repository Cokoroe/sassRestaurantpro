// src/features/billing/pages/BillingGroupCreatePage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, RefreshCcw, CheckCircle2 } from "lucide-react";

import { billingService } from "../../../api/services/billing.service";
import type {
  BillingGroupPrepareItem,
  CreateGroupRequest,
  UUID,
} from "../../../types/billing";

function safeStr(v?: string | null) {
  return (v ?? "").trim();
}

export function BillingGroupCreatePage() {
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // prepare data
  const [prepLoading, setPrepLoading] = useState(false);
  const [tables, setTables] = useState<BillingGroupPrepareItem[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const selectedTableIds: UUID[] = useMemo(() => {
    return Object.entries(selected)
      .filter(([, v]) => v)
      .map(([k]) => k as UUID);
  }, [selected]);

  const loadPrepare = async () => {
    setPrepLoading(true);
    setErr(null);
    try {
      // outletId optional (BE tự lấy currentOutletId nếu null)
      const data = await billingService.prepareGroup();
      setTables(data?.tables ?? []);
      setSelected({});
    } catch (e: any) {
      setErr(
        e?.response?.data?.message ??
          e?.message ??
          "Không load được danh sách bàn để ghép nhóm."
      );
      setTables([]);
      setSelected({});
    } finally {
      setPrepLoading(false);
    }
  };

  useEffect(() => {
    loadPrepare();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (tableId: UUID) => {
    setSelected((prev) => ({ ...prev, [tableId]: !prev[tableId] }));
  };

  const canCreate = useMemo(() => {
    if (loading || prepLoading) return false;
    if (!safeStr(name)) return false;
    // cần ít nhất 2 bàn để ghép (tuỳ bạn, có thể cho 1 bàn)
    if (selectedTableIds.length < 2) return false;
    // tất cả bàn được chọn phải có activeOrderId (nếu muốn strict)
    return true;
  }, [loading, prepLoading, name, selectedTableIds.length]);

  const onCreate = async () => {
    setErr(null);

    const groupName = safeStr(name);
    if (!groupName) {
      setErr("Vui lòng nhập tên group");
      return;
    }

    if (selectedTableIds.length < 2) {
      setErr("Vui lòng chọn ít nhất 2 bàn để ghép nhóm");
      return;
    }

    // (optional) chặn nếu chọn bàn không có active order
    const missingActive = tables
      .filter((t) => selectedTableIds.includes(t.tableId))
      .filter((t) => !t.activeOrderId);

    if (missingActive.length > 0) {
      setErr(
        "Có bàn bạn chọn hiện không có order đang mở. Hãy bỏ chọn bàn đó."
      );
      return;
    }

    const payload: CreateGroupRequest = {
      name: groupName,
      note: safeStr(note) ? safeStr(note) : null,
      tableIds: selectedTableIds,
      // orderIds: không cần truyền nữa (BE tự resolve theo tableIds)
    };

    setLoading(true);
    try {
      const id = await billingService.createGroup(payload);
      nav(`/app/billing/groups/${id}`);
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? e?.message ?? "Tạo group thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4 max-w-3xl">
      <Link
        to="/app/billing/groups"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft size={16} />
        Quay lại
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xl font-bold">Tạo Billing Group</div>
          <div className="text-sm text-slate-500">
            Chọn bàn (ví dụ: bàn 1 + bàn 2) để ghép các order đang mở tương ứng.
          </div>
        </div>

        <button
          className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
          onClick={loadPrepare}
          disabled={prepLoading || loading}
        >
          <RefreshCcw size={16} />
          Reload bàn
        </button>
      </div>

      {err && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      )}

      {/* Form */}
      <div className="rounded-2xl border bg-white p-4 space-y-3">
        <div>
          <div className="text-xs font-medium text-slate-600 mb-1">
            Tên group
          </div>
          <input
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ví dụ: Nhóm bàn 1-2"
            disabled={loading}
          />
        </div>

        <div>
          <div className="text-xs font-medium text-slate-600 mb-1">Ghi chú</div>
          <textarea
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Tuỳ chọn"
            disabled={loading}
          />
        </div>
      </div>

      {/* Tables pick */}
      <div className="rounded-2xl border bg-white overflow-hidden">
        <div className="flex items-center justify-between border-b bg-slate-50 px-4 py-3">
          <div className="text-sm font-semibold">Chọn bàn để ghép</div>
          <div className="text-xs text-slate-600">
            Đã chọn:{" "}
            <span className="font-semibold">{selectedTableIds.length}</span>
          </div>
        </div>

        {prepLoading ? (
          <div className="p-4 text-sm text-slate-600">
            Đang tải danh sách bàn...
          </div>
        ) : tables.length === 0 ? (
          <div className="p-4 text-sm text-slate-600">
            Không có bàn trong outlet.
          </div>
        ) : (
          <div className="divide-y">
            {tables.map((t) => {
              const checked = !!selected[t.tableId];
              const hasActive = !!t.activeOrderId;

              return (
                <button
                  key={t.tableId}
                  type="button"
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 disabled:opacity-60"
                  onClick={() => toggle(t.tableId)}
                  disabled={loading}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {checked ? (
                          <CheckCircle2 className="text-green-600" size={18} />
                        ) : (
                          <span className="inline-block h-[18px] w-[18px] rounded-full border" />
                        )}
                        <div className="font-semibold truncate">
                          {safeStr(t.tableCode) || "Bàn"}{" "}
                          {safeStr(t.tableName)
                            ? `- ${safeStr(t.tableName)}`
                            : ""}
                        </div>
                      </div>

                      <div className="mt-1 text-xs text-slate-500 truncate">
                        TableId: {t.tableId}
                      </div>
                    </div>

                    <div className="text-right">
                      {hasActive ? (
                        <div className="text-xs">
                          <div className="inline-flex rounded-full border px-2 py-1">
                            {t.activeOrderStatus ?? "ACTIVE"}
                          </div>
                          <div className="mt-1 text-[11px] text-slate-500">
                            Order: {t.activeOrderId}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-amber-700">
                          <div className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-1">
                            Không có order mở
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <button
        className="h-10 w-full rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        onClick={onCreate}
        disabled={!canCreate}
        title={
          safeStr(name) && selectedTableIds.length >= 2
            ? "Tạo group"
            : "Nhập tên group và chọn ít nhất 2 bàn"
        }
      >
        {loading ? "Đang tạo..." : "Tạo group"}
      </button>

      <div className="text-xs text-slate-500">
        * Chỉ nên chọn các bàn đang có order mở. BE sẽ tự lấy order đang mở mới
        nhất của mỗi bàn.
      </div>
    </div>
  );
}
