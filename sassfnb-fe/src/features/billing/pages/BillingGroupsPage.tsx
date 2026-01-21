import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, RefreshCcw, CreditCard } from "lucide-react";

import { billingService } from "../../../api/services/billing.service";
import type { BillingGroupSummary, UUID } from "../../../types/billing";
import { BillingTotalsModal } from "../components/BillingTotalsModal";

export function BillingGroupsPage() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<BillingGroupSummary[]>([]);

  const [billOpen, setBillOpen] = useState(false);
  const [groupId, setGroupId] = useState<UUID | undefined>(undefined);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const page = await billingService.listGroups({ page: 0, size: 50 });
      setRows(page?.content ?? []);
    } catch (e: any) {
      setErr(
        e?.response?.data?.message ??
          e?.message ??
          "Không tải được billing groups."
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xl font-bold">Billing Groups</div>
          <div className="text-sm text-slate-500">
            Chia bill theo nhóm (tùy chọn)
          </div>
        </div>

        <div className="flex gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
            onClick={load}
            disabled={loading}
          >
            <RefreshCcw size={16} />
            Refresh
          </button>

          <Link
            to="/app/billing/groups/new"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Plus size={16} />
            Tạo group
          </Link>
        </div>
      </div>

      {err && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      )}

      <div className="rounded-2xl border bg-white overflow-hidden">
        <div className="grid grid-cols-12 border-b bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600">
          <div className="col-span-4">Group</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-3">Ghi chú</div>
          <div className="col-span-3 text-right">Hành động</div>
        </div>

        {loading ? (
          <div className="p-4 text-sm text-slate-600">Đang tải...</div>
        ) : rows.length === 0 ? (
          <div className="p-4 text-sm text-slate-600">Chưa có group.</div>
        ) : (
          rows.map((g) => (
            <div
              key={g.id}
              className="grid grid-cols-12 items-center px-4 py-3 border-b last:border-b-0"
            >
              <div className="col-span-4 min-w-0">
                <div className="font-semibold truncate">{g.name ?? g.id}</div>
                <div className="text-xs text-slate-500 truncate">{g.id}</div>
              </div>

              <div className="col-span-2">
                <span className="inline-flex rounded-full border px-2 py-1 text-xs">
                  {g.status ?? "-"}
                </span>
              </div>

              <div className="col-span-3 text-sm text-slate-700 truncate">
                {g.note ?? "-"}
              </div>

              <div className="col-span-3 flex justify-end gap-2">
                <Link
                  to={`/app/billing/groups/${g.id}`}
                  className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-slate-50"
                >
                  Chi tiết
                </Link>

                <button
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  onClick={() => {
                    setGroupId(g.id);
                    setBillOpen(true);
                  }}
                >
                  <CreditCard size={16} />
                  Thanh toán
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <BillingTotalsModal
        open={billOpen}
        onClose={() => setBillOpen(false)}
        scope="GROUP"
        groupId={groupId}
        title="Thanh toán nhóm"
        allowClose
        allowSepayPlaceholder
      />
    </div>
  );
}
