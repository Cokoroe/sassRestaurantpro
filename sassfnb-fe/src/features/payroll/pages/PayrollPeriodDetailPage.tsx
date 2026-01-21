// src/features/payroll/pages/PayrollPeriodDetailPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppContextStore } from "../../../store/useAppContextStore";
import { staffService } from "../../../api/services/staff.service";
import { payrollService } from "../../../api/services/payroll.service";
import type { StaffOption } from "../../../types/staff";
import type { PayrollPeriodDetailsResponse } from "../../../types/payroll";

const fmtMoney = (n: number) =>
  Number.isFinite(n)
    ? n.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : "0";

export default function PayrollPeriodDetailPage() {
  const nav = useNavigate();
  const { periodId } = useParams();

  const outletId = useAppContextStore((s) => s.outletId);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [replaceExisting, setReplaceExisting] = useState(true);
  const [data, setData] = useState<PayrollPeriodDetailsResponse | null>(null);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);

  const staffLabel = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of staffOptions) m.set(s.id, s.name ?? s.id);
    return (id: string) => m.get(id) ?? id;
  }, [staffOptions]);

  const loadStaffOptions = async () => {
    if (!outletId) return;
    try {
      const opts = await staffService.options(outletId);
      setStaffOptions(opts ?? []);
    } catch {
      // ignore
    }
  };

  const load = async () => {
    if (!periodId) return;
    setLoading(true);
    setErr(null);
    try {
      const d = await payrollService.getDetails(periodId);
      setData(d);
    } catch (e: any) {
      setErr(
        e?.response?.data?.message ??
          e?.message ??
          "Load payroll period details failed"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaffOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outletId]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodId]);

  const doCalculate = async () => {
    if (!periodId) return;
    setLoading(true);
    setErr(null);
    try {
      const d = await payrollService.calculate(periodId, replaceExisting);
      setData(d);
    } catch (e: any) {
      setErr(
        e?.response?.data?.message ?? e?.message ?? "Calculate payroll failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const doClose = async () => {
    if (!periodId) return;
    if (!confirm("Đóng kỳ lương? Sau khi đóng sẽ không calculate được nữa."))
      return;

    setLoading(true);
    setErr(null);
    try {
      await payrollService.closePeriod(periodId);
      await load();
    } catch (e: any) {
      setErr(
        e?.response?.data?.message ??
          e?.message ??
          "Close payroll period failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const period = data?.period;
  const details = data?.details ?? [];

  const totalHours = details.reduce((s, d) => s + Number(d.totalHours ?? 0), 0);
  const totalGross = details.reduce((s, d) => s + Number(d.grossPay ?? 0), 0);
  const totalTips = details.reduce((s, d) => s + Number(d.tipsAmount ?? 0), 0);
  const totalNet = details.reduce((s, d) => s + Number(d.netPay ?? 0), 0);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            Chi tiết kỳ lương
          </h1>
          <p className="text-sm text-slate-500">
            Tính tổng giờ (attendance_records) + tips (payments) + rate.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
            onClick={() => nav("/app/payroll/periods")}
          >
            Quay lại
          </button>

          {period?.status === "OPEN" && (
            <button
              className="h-10 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold disabled:opacity-60"
              onClick={doClose}
              disabled={loading}
            >
              Đóng kỳ
            </button>
          )}
        </div>
      </div>

      {!outletId && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
          Bạn cần chọn <b>Outlet</b> ở góc trên để dùng Payroll.
        </div>
      )}

      {err && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {err}
        </div>
      )}

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-sm text-slate-500">Period</div>
            <div className="text-lg font-bold text-slate-800">
              {period ? `${period.startDate} → ${period.endDate}` : "-"}
            </div>
            <div className="text-xs text-slate-500 mt-1">{period?.id}</div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={[
                "px-3 py-1.5 rounded-xl text-xs font-bold",
                period?.status === "OPEN"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-700",
              ].join(" ")}
            >
              {period?.status ?? "-"}
            </span>

            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={replaceExisting}
                  onChange={(e) => setReplaceExisting(e.target.checked)}
                />
                Replace existing
              </label>

              <button
                className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-60"
                onClick={doCalculate}
                disabled={loading || period?.status !== "OPEN"}
                title={period?.status !== "OPEN" ? "Kỳ lương đã đóng" : ""}
              >
                Calculate
              </button>

              <button
                className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                onClick={load}
                disabled={loading}
              >
                Tải lại
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-xs text-slate-500">Total hours</div>
            <div className="text-lg font-bold text-slate-800">
              {totalHours.toFixed(2)}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-xs text-slate-500">Gross</div>
            <div className="text-lg font-bold text-slate-800">
              {fmtMoney(totalGross)}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-xs text-slate-500">Tips</div>
            <div className="text-lg font-bold text-slate-800">
              {fmtMoney(totalTips)}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-xs text-slate-500">Net</div>
            <div className="text-lg font-bold text-slate-800">
              {fmtMoney(totalNet)}
            </div>
          </div>
        </div>
      </div>

      {/* Details table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="font-bold text-slate-800">Payroll details</div>
          <div className="text-xs text-slate-500">{details.length} dòng</div>
        </div>

        <div className="overflow-auto">
          <table className="min-w-[1100px] w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-4 py-3">Staff</th>
                <th className="text-right px-4 py-3">Hours</th>
                <th className="text-right px-4 py-3">Gross</th>
                <th className="text-right px-4 py-3">Tips</th>
                <th className="text-right px-4 py-3">Net</th>
                <th className="text-left px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {details.map((d) => (
                <tr
                  key={d.id}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800">
                      {staffLabel(d.staffId)}
                    </div>
                    <div className="text-xs text-slate-500">{d.staffId}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {Number(d.totalHours ?? 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {fmtMoney(Number(d.grossPay ?? 0))}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {fmtMoney(Number(d.tipsAmount ?? 0))}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">
                    {fmtMoney(Number(d.netPay ?? 0))}
                  </td>
                  <td className="px-4 py-3">{d.updatedAt ?? "-"}</td>
                </tr>
              ))}

              {!loading && details.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={6}>
                    Chưa có dữ liệu. Bấm <b>Calculate</b> để tính.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={6}>
                    Đang tải...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
