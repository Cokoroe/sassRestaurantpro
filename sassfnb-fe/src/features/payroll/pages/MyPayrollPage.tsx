// src/features/payroll/pages/MyPayrollPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useAppContextStore } from "../../../store/useAppContextStore";
import { staffService } from "../../../api/services/staff.service";
import { payrollService } from "../../../api/services/payroll.service";
import type {
  PayrollPeriodDetailsResponse,
  PayrollPeriodResponse,
} from "../../../types/payroll";

const fmtMoney = (n: number) =>
  Number.isFinite(n)
    ? n.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : "0";

export default function MyPayrollPage() {
  const outletIdFromContext = useAppContextStore((s) => s.outletId);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [meStaffId, setMeStaffId] = useState<string | null>(null);
  const [outletId, setOutletId] = useState<string | null>(outletIdFromContext);

  const [periods, setPeriods] = useState<PayrollPeriodResponse[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");

  const [detail, setDetail] = useState<PayrollPeriodDetailsResponse | null>(
    null,
  );

  // sync context outlet (nếu STAFF đổi outlet không được thì nó vẫn có sẵn)
  useEffect(() => {
    setOutletId(outletIdFromContext);
  }, [outletIdFromContext]);

  const myRow = useMemo(() => {
    const staffId = meStaffId;
    if (!staffId) return null;
    const details = detail?.details ?? [];
    return details.find((d) => d.staffId === staffId) ?? null;
  }, [detail, meStaffId]);

  const loadMe = async () => {
    setErr(null);
    try {
      const me = await staffService.me();
      const anyMe: any = me;
      // tùy backend trả về field gì:
      const staffId = anyMe?.id ?? anyMe?.staffId ?? null;
      setMeStaffId(staffId);

      // nếu BE trả outletId trong /staffs/me thì ưu tiên dùng
      const oId = anyMe?.outletId ?? outletIdFromContext ?? null;
      setOutletId(oId);
    } catch (e: any) {
      setErr(
        e?.response?.data?.message ??
          e?.message ??
          "Không lấy được thông tin staff (me)",
      );
    }
  };

  const loadPeriods = async (oid: string) => {
    setErr(null);
    try {
      const list = await payrollService.listPeriods(oid);
      setPeriods(list ?? []);

      // auto chọn kỳ mới nhất (đầu danh sách hoặc cuối tùy backend)
      const first = (list ?? [])[0];
      if (first?.id && !selectedPeriodId) setSelectedPeriodId(first.id);
    } catch (e: any) {
      setErr(
        e?.response?.data?.message ??
          e?.message ??
          "Không tải được danh sách kỳ lương",
      );
    }
  };

  const loadDetails = async (pid: string) => {
    setErr(null);
    try {
      const d = await payrollService.getDetails(pid);
      setDetail(d);
    } catch (e: any) {
      setErr(
        e?.response?.data?.message ??
          e?.message ??
          "Không tải được chi tiết kỳ lương",
      );
    }
  };

  const init = async () => {
    setLoading(true);
    try {
      await loadMe();
    } finally {
      setLoading(false);
    }
  };

  // init: load me
  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // load periods when outletId available
  useEffect(() => {
    if (!outletId) return;
    loadPeriods(outletId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outletId]);

  // load details when selected period changes
  useEffect(() => {
    if (!selectedPeriodId) return;
    loadDetails(selectedPeriodId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriodId]);

  const period = detail?.period ?? null;

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Lương của tôi</h1>
        <p className="text-sm text-slate-500">
          Xem tổng giờ, tips và tổng lương trong từng kỳ.
        </p>
      </div>

      {!outletId && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
          Chưa có <b>outlet</b>. Vui lòng chọn outlet (hoặc kiểm tra /staffs/me
          có outletId).
        </div>
      )}

      {err && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {err}
        </div>
      )}

      {/* Select period */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Chọn kỳ lương
            </label>
            <select
              className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              disabled={!outletId || periods.length === 0}
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.startDate} → {p.endDate} ({p.status})
                </option>
              ))}
            </select>
          </div>

          <div className="text-sm text-slate-500">
            <div>
              <b>Status:</b> {period?.status ?? "-"}
            </div>
            <div className="text-xs">
              <b>PeriodId:</b> {period?.id ?? "-"}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
              onClick={() => {
                if (outletId) loadPeriods(outletId);
                if (selectedPeriodId) loadDetails(selectedPeriodId);
              }}
              disabled={loading}
            >
              Tải lại
            </button>
          </div>
        </div>
      </div>

      {/* My payroll summary */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="font-bold text-slate-800 mb-3">
          Tổng kết lương của tôi
        </div>

        {!meStaffId && (
          <div className="text-sm text-slate-500">
            Đang lấy thông tin staff...
          </div>
        )}

        {meStaffId && !myRow && (
          <div className="text-sm text-slate-500">
            Kỳ này chưa có dữ liệu lương cho bạn (có thể chưa calculate hoặc
            không có giờ/tips).
          </div>
        )}

        {myRow && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-xs text-slate-500">Total hours</div>
              <div className="text-lg font-bold text-slate-800">
                {Number(myRow.totalHours ?? 0).toFixed(2)}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-xs text-slate-500">Gross</div>
              <div className="text-lg font-bold text-slate-800">
                {fmtMoney(Number(myRow.grossPay ?? 0))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-xs text-slate-500">Tips</div>
              <div className="text-lg font-bold text-slate-800">
                {fmtMoney(Number(myRow.tipsAmount ?? 0))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-xs text-slate-500">Net pay</div>
              <div className="text-lg font-bold text-slate-900">
                {fmtMoney(Number(myRow.netPay ?? 0))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* (Optional) show raw details debug */}
      {myRow && (
        <div className="text-xs text-slate-500">
          <b>updatedAt:</b> {myRow.updatedAt ?? "-"}
        </div>
      )}
    </div>
  );
}
