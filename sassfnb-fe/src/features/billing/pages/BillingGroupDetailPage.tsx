import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Trash2, CreditCard, RefreshCcw } from "lucide-react";

import { billingService } from "../../../api/services/billing.service";
import type {
  BillingGroupDetailResponse,
  UpdateGroupRequest,
} from "../../../types/billing";
import { BillingTotalsModal } from "../components/BillingTotalsModal";

export function BillingGroupDetailPage() {
  const { groupId = "" } = useParams();
  const nav = useNavigate();

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [data, setData] = useState<BillingGroupDetailResponse | null>(null);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");

  const [billOpen, setBillOpen] = useState(false);

  const load = async () => {
    if (!groupId) return;
    setLoading(true);
    setErr(null);
    try {
      const d = await billingService.getGroup(groupId as any);
      setData(d);
      setName(d?.name ?? "");
      setNote(d?.note ?? "");
    } catch (e: any) {
      setErr(
        e?.response?.data?.message ?? e?.message ?? "Không tải được group"
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const onSave = async () => {
    if (!groupId) return;
    setErr(null);
    setLoading(true);
    try {
      const payload: UpdateGroupRequest = {
        name: name.trim(),
        note: note.trim() || null,
      };

      await billingService.updateGroup(groupId as any, payload);
      await load();
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? e?.message ?? "Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!groupId) return;
    if (!confirm("Xóa group này?")) return;

    setErr(null);
    setLoading(true);
    try {
      await billingService.deleteGroup(groupId as any);
      nav("/app/billing/groups", { replace: true });
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? e?.message ?? "Xóa thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4 max-w-3xl">
      <div className="flex items-start justify-between gap-3">
        <Link
          to="/app/billing/groups"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Quay lại
        </Link>

        <div className="flex gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
            onClick={load}
            disabled={loading}
          >
            <RefreshCcw size={16} />
            Refresh
          </button>

          <button
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            onClick={() => setBillOpen(true)}
            disabled={loading}
          >
            <CreditCard size={16} />
            Thanh toán
          </button>
        </div>
      </div>

      <div>
        <div className="text-xl font-bold">Group Detail</div>
        <div className="text-xs text-slate-500">{groupId}</div>
      </div>

      {err && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      )}

      {/* Summary (để khỏi warning "data is declared but never read") */}
      <div className="rounded-2xl border bg-white p-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-slate-500">Trạng thái</div>
            <div className="font-semibold">{data?.status ?? "-"}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Số order</div>
            <div className="font-semibold">{data?.orders?.length ?? 0}</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 space-y-3">
        <div>
          <div className="text-xs font-medium text-slate-600 mb-1">
            Tên group
          </div>
          <input
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <div className="text-xs font-medium text-slate-600 mb-1">Ghi chú</div>
          <textarea
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="flex gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            onClick={onSave}
            disabled={loading}
          >
            <Save size={16} />
            Lưu
          </button>

          <button
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
            onClick={onDelete}
            disabled={loading}
          >
            <Trash2 size={16} />
            Xóa
          </button>
        </div>
      </div>

      <BillingTotalsModal
        open={billOpen}
        onClose={() => setBillOpen(false)}
        scope="GROUP"
        groupId={groupId as any}
        title="Thanh toán nhóm"
        allowClose
        allowSepayPlaceholder
      />
    </div>
  );
}
