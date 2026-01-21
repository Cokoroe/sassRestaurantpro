// src/features/payroll/pages/PayrollPeriodsPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContextStore } from "../../../store/useAppContextStore";
import { payrollService } from "../../../api/services/payroll.service";
import type { PayrollPeriodResponse } from "../../../types/payroll";

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function PayrollPeriodsPage() {
  const nav = useNavigate();
  const outletId = useAppContextStore((s) => s.outletId);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<PayrollPeriodResponse[]>([]);

  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(todayISO());

  const load = async () => {
    if (!outletId) return;
    setLoading(true);
    setErr(null);
    try {
      const data = await payrollService.listPeriods(outletId);
      setRows(data ?? []);
    } catch (e: any) {
      setErr(
        e?.response?.data?.message ??
          e?.message ??
          "Load payroll periods failed"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outletId]);

  const createPeriod = async () => {
    if (!outletId) return setErr("Bạn chưa chọn outlet");
    if (!startDate || !endDate) return setErr("Vui lòng chọn start/end date");
    setLoading(true);
    setErr(null);
    try {
      const created = await payrollService.createPeriod({
        outletId,
        startDate,
        endDate,
      });
      await load();
      nav(`/app/payroll/periods/${created.id}`);
    } catch (e: any) {
      setErr(
        e?.response?.data?.message ??
          e?.message ??
          "Create payroll period failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const closePeriod = async (id: string) => {
    if (
      !confirm("Đóng kỳ lương này? Sau khi đóng sẽ không calculate được nữa.")
    )
      return;
    setLoading(true);
    setErr(null);
    try {
      await payrollService.closePeriod(id);
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

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-800">
          Kỳ lương (Payroll Periods)
        </h1>
        <p className="text-sm text-slate-500">
          Tạo kỳ lương theo outlet, sau đó calculate để ra bảng trả lương.
        </p>
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

      {/* Create */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="font-bold text-slate-800 mb-3">Tạo kỳ lương</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Start date
            </label>
            <input
              type="date"
              className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={!outletId || loading}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              End date
            </label>
            <input
              type="date"
              className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={!outletId || loading}
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-60"
              onClick={createPeriod}
              disabled={!outletId || loading}
            >
              Tạo kỳ lương
            </button>
            <button
              className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
              onClick={load}
              disabled={!outletId || loading}
            >
              Tải lại
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="font-bold text-slate-800">Danh sách kỳ lương</div>
          <div className="text-xs text-slate-500">{rows.length} kỳ</div>
        </div>

        <div className="overflow-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-4 py-3">Period</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Created</th>
                <th className="text-left px-4 py-3">Closed</th>
                <th className="text-right px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800">
                      {p.startDate} → {p.endDate}
                    </div>
                    <div className="text-xs text-slate-500">{p.id}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={[
                        "px-2 py-1 rounded-lg text-xs font-bold",
                        p.status === "OPEN"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-700",
                      ].join(" ")}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{p.createdAt ?? "-"}</td>
                  <td className="px-4 py-3">{p.closedAt ?? "-"}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      className="h-9 px-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                      onClick={() => nav(`/app/payroll/periods/${p.id}`)}
                    >
                      Chi tiết
                    </button>
                    {p.status === "OPEN" && (
                      <button
                        className="h-9 px-3 rounded-xl bg-rose-600 text-white hover:bg-rose-700"
                        onClick={() => closePeriod(p.id)}
                      >
                        Đóng kỳ
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {!loading && rows.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={5}>
                    Chưa có kỳ lương nào.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={5}>
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
