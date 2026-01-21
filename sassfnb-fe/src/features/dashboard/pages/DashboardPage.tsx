// src/features/dashboard/pages/DashboardPage.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  Wallet,
  Layers,
  UtensilsCrossed,
  Clock,
  ArrowRight,
} from "lucide-react";

import { useAppContextStore } from "../../../store/useAppContextStore";
import { reportService } from "../../../api/services/report.service";

import type {
  SummaryResponse,
  TopItemsResponse,
  PeakHoursResponse,
  PayrollSummaryResponse,
} from "../../../types/report";

function yyyyMMdd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}
function formatMoney(v?: number) {
  const n = Number(v ?? 0);
  return n.toLocaleString("vi-VN");
}

function KpiCard({
  title,
  value,
  sub,
  icon,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-gray-500">{title}</div>
          <div className="mt-1 text-2xl font-semibold">{value}</div>
          {sub && <div className="mt-1 text-xs text-gray-500">{sub}</div>}
        </div>
        <div className="rounded-lg bg-gray-50 p-2">{icon}</div>
      </div>
    </div>
  );
}

function Panel({
  title,
  icon,
  right,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-base font-semibold">{title}</h2>
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

export default function DashboardPage() {
  // ✅ zustand v4: không truyền shallow param thứ 2
  const outletId = useAppContextStore((s) => s.outletId);
  const outletName = useAppContextStore((s) => s.outletName);
  const restaurantName = useAppContextStore((s) => s.restaurantName);

  // dashboard: tháng hiện tại
  const [fromDate] = useState(() => yyyyMMdd(startOfMonth(new Date())));
  const [toDate] = useState(() => yyyyMMdd(endOfMonth(new Date())));
  const limit = 5;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [topItems, setTopItems] = useState<TopItemsResponse | null>(null);
  const [peakHours, setPeakHours] = useState<PeakHoursResponse | null>(null);
  const [payrollSummary, setPayrollSummary] =
    useState<PayrollSummaryResponse | null>(null);

  const netRevenue = useMemo(() => {
    const gross = Number(summary?.grossRevenue ?? 0);
    const tips = Number(summary?.tipsTotal ?? 0);
    return summary?.netRevenue ?? gross - tips;
  }, [summary]);

  const resetData = useCallback(() => {
    setSummary(null);
    setTopItems(null);
    setPeakHours(null);
    setPayrollSummary(null);
  }, []);

  const load = useCallback(async () => {
    setError(null);

    if (!outletId) {
      resetData();
      setError("Bạn chưa chọn Outlet. Hãy chọn Outlet ở sidebar.");
      return;
    }

    setLoading(true);
    try {
      const base = { outletId, fromDate, toDate };

      // ✅ wrapper http trả thẳng data => KHÔNG .data
      const [s, ti, ph, ps] = await Promise.all([
        reportService.summary(base),
        reportService.topItems({ ...base, limit }),
        reportService.peakHours(base),
        reportService.payrollSummary(base),
      ]);

      setSummary(s);
      setTopItems(ti);

      const rawPh: any = ph;
      if (!rawPh.hours && rawPh.items) rawPh.hours = rawPh.items;
      setPeakHours(rawPh);

      setPayrollSummary(ps);
    } catch (e: any) {
      setError(
        e?.response?.data?.message || e?.message || "Có lỗi khi tải dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }, [outletId, fromDate, toDate, resetData]);

  // ✅ chỉ reload khi outletId đổi (sidebar đổi outlet => outletId đổi)
  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <div className="text-sm text-gray-500">
            {restaurantName ? (
              <>
                <span className="font-medium">{restaurantName}</span>
                {" • "}
              </>
            ) : null}
            Outlet: <span className="font-medium">{outletName || "—"}</span>{" "}
            <span className="text-xs">
              ({fromDate} → {toDate})
            </span>
          </div>
        </div>

        <Link
          to="/app/reports"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-black px-4 text-sm font-medium text-white"
        >
          Xem report chi tiết <ArrowRight size={18} />
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <KpiCard
          title="Doanh thu gộp (tháng)"
          value={`${formatMoney(summary?.grossRevenue)} ₫`}
          icon={<TrendingUp size={18} />}
        />
        <KpiCard
          title="Tip (tháng)"
          value={`${formatMoney(summary?.tipsTotal)} ₫`}
          icon={<Wallet size={18} />}
        />
        <KpiCard
          title="Doanh thu thực (tháng)"
          value={`${formatMoney(netRevenue)} ₫`}
          icon={<TrendingUp size={18} />}
        />
        <KpiCard
          title="Số đơn (tháng)"
          value={`${summary?.ordersCount ?? 0}`}
          icon={<Layers size={18} />}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel
          title="Top món bán chạy (Top 5)"
          icon={<UtensilsCrossed size={18} />}
        >
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500">
                <tr className="border-b">
                  <th className="py-2 pr-2">Món</th>
                  <th className="py-2 pr-2 text-right">SL</th>
                  <th className="py-2 pr-2 text-right">Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                {(topItems?.items ?? []).map((x) => (
                  <tr key={x.menuItemId} className="border-b last:border-b-0">
                    <td className="py-2 pr-2">{x.itemName}</td>
                    <td className="py-2 pr-2 text-right">{x.qtySold}</td>
                    <td className="py-2 pr-2 text-right">
                      {formatMoney(x.grossAmount)} ₫
                    </td>
                  </tr>
                ))}
                {(!topItems?.items || topItems.items.length === 0) && (
                  <tr>
                    <td colSpan={3} className="py-3 text-center text-gray-500">
                      Không có dữ liệu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Giờ cao điểm (tháng)" icon={<Clock size={18} />}>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500">
                <tr className="border-b">
                  <th className="py-2 pr-2">Giờ</th>
                  <th className="py-2 pr-2 text-right">Đơn</th>
                  <th className="py-2 pr-2 text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                {(peakHours?.hours ?? []).map((x: any) => (
                  <tr key={x.hourOfDay} className="border-b last:border-b-0">
                    <td className="py-2 pr-2">
                      {String(x.hourOfDay).padStart(2, "0")}:00
                    </td>
                    <td className="py-2 pr-2 text-right">{x.ordersCount}</td>
                    <td className="py-2 pr-2 text-right">
                      {formatMoney(x.netRevenue)} ₫
                    </td>
                  </tr>
                ))}
                {(!peakHours?.hours || peakHours.hours.length === 0) && (
                  <tr>
                    <td colSpan={3} className="py-3 text-center text-gray-500">
                      Không có dữ liệu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          title="Tổng lương trong kỳ (tháng)"
          icon={<Wallet size={18} />}
          right={
            <Link
              to="/app/reports"
              className="text-sm font-medium text-gray-700 hover:underline"
            >
              Xem chi tiết
            </Link>
          }
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Tổng giờ</div>
              <div className="mt-1 text-lg font-semibold">
                {Number(payrollSummary?.totalHours ?? 0).toFixed(2)}
              </div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Gross</div>
              <div className="mt-1 text-lg font-semibold">
                {formatMoney(payrollSummary?.grossPay)} ₫
              </div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Tips</div>
              <div className="mt-1 text-lg font-semibold">
                {formatMoney(payrollSummary?.tipsAmount)} ₫
              </div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Net</div>
              <div className="mt-1 text-lg font-semibold">
                {formatMoney(payrollSummary?.netPay)} ₫
              </div>
            </div>
          </div>
        </Panel>
      </div>

      {loading ? (
        <div className="mt-3 text-sm text-gray-500">Đang tải...</div>
      ) : null}
    </div>
  );
}
