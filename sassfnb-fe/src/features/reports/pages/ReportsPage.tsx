// src/features/reports/pages/ReportsPage.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  UtensilsCrossed,
  Layers,
  Clock,
  Table2,
  Users,
  Wallet,
  RefreshCcw,
} from "lucide-react";

import { useAppContextStore } from "../../../store/useAppContextStore";
import { reportService } from "../../../api/services/report.service";

import type {
  SummaryResponse,
  TopItemsResponse,
  TopCategoriesResponse,
  PeakHoursResponse,
  TableTurnoverResponse,
  StaffPerformanceResponse,
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

function CardKpi(props: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-gray-500">{props.title}</div>
          <div className="mt-1 text-2xl font-semibold">{props.value}</div>
          {props.sub && (
            <div className="mt-1 text-xs text-gray-500">{props.sub}</div>
          )}
        </div>
        <div className="rounded-lg bg-gray-50 p-2">{props.icon}</div>
      </div>
    </div>
  );
}

function Section({
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

export default function ReportsPage() {
  // ✅ zustand v4: lấy từng field để khỏi cần shallow
  const outletId = useAppContextStore((s) => s.outletId);
  const outletName = useAppContextStore((s) => s.outletName);
  const restaurantName = useAppContextStore((s) => s.restaurantName);

  const [fromDate, setFromDate] = useState(() =>
    yyyyMMdd(startOfMonth(new Date())),
  );
  const [toDate, setToDate] = useState(() => yyyyMMdd(endOfMonth(new Date())));
  const [limit, setLimit] = useState(10);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [topItems, setTopItems] = useState<TopItemsResponse | null>(null);
  const [topCategories, setTopCategories] =
    useState<TopCategoriesResponse | null>(null);
  const [peakHours, setPeakHours] = useState<PeakHoursResponse | null>(null);
  const [tableTurnover, setTableTurnover] =
    useState<TableTurnoverResponse | null>(null);
  const [staffPerformance, setStaffPerformance] =
    useState<StaffPerformanceResponse | null>(null);
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
    setTopCategories(null);
    setPeakHours(null);
    setTableTurnover(null);
    setStaffPerformance(null);
    setPayrollSummary(null);
  }, []);

  const load = useCallback(async () => {
    setError(null);

    if (!outletId) {
      resetData();
      setError(
        "Bạn chưa chọn Outlet. Hãy chọn Outlet ở sidebar trước khi xem report.",
      );
      return;
    }

    setLoading(true);
    try {
      const base = { outletId, fromDate, toDate };

      const [s, ti, tc, ph, tt, sp, ps] = await Promise.all([
        reportService.summary(base),
        reportService.topItems({ ...base, limit }),
        reportService.topCategories({ ...base, limit }),
        reportService.peakHours(base),
        reportService.tableTurnover(base),
        reportService.staffPerformance(base),
        reportService.payrollSummary(base),
      ]);

      setSummary(s);
      setTopItems(ti);

      const rawTc: any = tc;
      if (!rawTc.categories && rawTc.items) rawTc.categories = rawTc.items;
      setTopCategories(rawTc);

      const rawPh: any = ph;
      if (!rawPh.hours && rawPh.items) rawPh.hours = rawPh.items;
      setPeakHours(rawPh);

      const rawTt: any = tt;
      if (!rawTt.tables && rawTt.items) rawTt.tables = rawTt.items;
      if (!rawTt.tables && rawTt.rows) rawTt.tables = rawTt.rows;
      setTableTurnover(rawTt);

      const rawSp: any = sp;
      if (!rawSp.staffs && rawSp.items) rawSp.staffs = rawSp.items;
      if (!rawSp.staffs && rawSp.rows) rawSp.staffs = rawSp.rows;
      setStaffPerformance(rawSp);

      setPayrollSummary(ps);
    } catch (e: any) {
      setError(
        e?.response?.data?.message || e?.message || "Có lỗi khi tải report.",
      );
    } finally {
      setLoading(false);
    }
  }, [outletId, fromDate, toDate, limit, resetData]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Báo cáo thống kê</h1>
          <div className="text-sm text-gray-500">
            {restaurantName ? (
              <>
                <span className="font-medium">{restaurantName}</span>
                {" • "}
              </>
            ) : null}
            Outlet: <span className="font-medium">{outletName || "—"}</span>{" "}
            <span className="font-mono text-xs">({outletId || "null"})</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-end">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Từ</label>
            <input
              type="date"
              className="h-10 rounded-lg border px-3 text-sm"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Đến</label>
            <input
              type="date"
              className="h-10 rounded-lg border px-3 text-sm"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Top</label>
            <input
              type="number"
              min={1}
              max={50}
              className="h-10 w-20 rounded-lg border px-3 text-sm"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value || 10))}
            />
          </div>

          <button
            onClick={load}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-black px-4 text-sm font-medium text-white disabled:opacity-60"
          >
            <RefreshCcw size={18} />
            {loading ? "Đang tải..." : "Tải báo cáo"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <CardKpi
          title="Doanh thu gộp"
          value={`${formatMoney(summary?.grossRevenue)} ₫`}
          sub={`${fromDate} → ${toDate}`}
          icon={<TrendingUp size={18} />}
        />
        <CardKpi
          title="Tiền tip"
          value={`${formatMoney(summary?.tipsTotal)} ₫`}
          icon={<Wallet size={18} />}
        />
        <CardKpi
          title="Doanh thu thực"
          value={`${formatMoney(netRevenue)} ₫`}
          icon={<TrendingUp size={18} />}
        />
        <CardKpi
          title="Số đơn đã thanh toán"
          value={`${summary?.ordersCount ?? 0}`}
          icon={<Layers size={18} />}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Top món bán chạy" icon={<UtensilsCrossed size={18} />}>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500">
                <tr className="border-b">
                  <th className="py-2 pr-2">#</th>
                  <th className="py-2 pr-2">Món</th>
                  <th className="py-2 pr-2">Nhóm</th>
                  <th className="py-2 pr-2 text-right">SL</th>
                  <th className="py-2 pr-2 text-right">Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                {(topItems?.items ?? []).map((x, idx) => (
                  <tr key={x.menuItemId} className="border-b last:border-b-0">
                    <td className="py-2 pr-2">{idx + 1}</td>
                    <td className="py-2 pr-2">{x.itemName}</td>
                    <td className="py-2 pr-2 text-gray-500">
                      {x.categoryName ?? "—"}
                    </td>
                    <td className="py-2 pr-2 text-right">{x.qtySold}</td>
                    <td className="py-2 pr-2 text-right">
                      {formatMoney(x.grossAmount)} ₫
                    </td>
                  </tr>
                ))}
                {(!topItems?.items || topItems.items.length === 0) && (
                  <tr>
                    <td colSpan={5} className="py-3 text-center text-gray-500">
                      Không có dữ liệu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Top nhóm bán chạy" icon={<Layers size={18} />}>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500">
                <tr className="border-b">
                  <th className="py-2 pr-2">#</th>
                  <th className="py-2 pr-2">Nhóm</th>
                  <th className="py-2 pr-2 text-right">SL</th>
                  <th className="py-2 pr-2 text-right">Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                {(topCategories?.categories ?? []).map(
                  (x: any, idx: number) => (
                    <tr key={x.categoryId} className="border-b last:border-b-0">
                      <td className="py-2 pr-2">{idx + 1}</td>
                      <td className="py-2 pr-2">{x.categoryName}</td>
                      <td className="py-2 pr-2 text-right">{x.qtySold}</td>
                      <td className="py-2 pr-2 text-right">
                        {formatMoney(x.grossAmount)} ₫
                      </td>
                    </tr>
                  ),
                )}
                {(!topCategories?.categories ||
                  topCategories.categories.length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-3 text-center text-gray-500">
                      Không có dữ liệu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Giờ cao điểm" icon={<Clock size={18} />}>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500">
                <tr className="border-b">
                  <th className="py-2 pr-2">Giờ</th>
                  <th className="py-2 pr-2 text-right">Số đơn</th>
                  <th className="py-2 pr-2 text-right">Gross</th>
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
                      {formatMoney(x.grossRevenue)} ₫
                    </td>
                    <td className="py-2 pr-2 text-right">
                      {formatMoney(x.netRevenue)} ₫
                    </td>
                  </tr>
                ))}
                {(!peakHours?.hours || peakHours.hours.length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-3 text-center text-gray-500">
                      Không có dữ liệu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Hiệu suất bàn" icon={<Table2 size={18} />}>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500">
                <tr className="border-b">
                  <th className="py-2 pr-2">Bàn</th>
                  <th className="py-2 pr-2 text-right">Số đơn</th>
                  <th className="py-2 pr-2 text-right">Net</th>
                  <th className="py-2 pr-2 text-right">TB (phút)</th>
                </tr>
              </thead>
              <tbody>
                {(tableTurnover?.tables ?? []).map((x: any) => (
                  <tr key={x.tableId} className="border-b last:border-b-0">
                    <td className="py-2 pr-2">
                      {x.tableName || x.tableCode || "—"}
                      {x.groupCode ? (
                        <span className="ml-2 text-xs text-gray-500">
                          ({x.groupCode})
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2 pr-2 text-right">{x.ordersCount}</td>
                    <td className="py-2 pr-2 text-right">
                      {formatMoney(x.netRevenue)} ₫
                    </td>
                    <td className="py-2 pr-2 text-right">
                      {Number(x.avgOccupancyMinutes ?? 0).toFixed(1)}
                    </td>
                  </tr>
                ))}
                {(!tableTurnover?.tables ||
                  tableTurnover.tables.length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-3 text-center text-gray-500">
                      Không có dữ liệu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Hiệu suất nhân viên" icon={<Users size={18} />}>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500">
                <tr className="border-b">
                  <th className="py-2 pr-2">NV</th>
                  <th className="py-2 pr-2 text-right">Đơn</th>
                  <th className="py-2 pr-2 text-right">Tip</th>
                  <th className="py-2 pr-2 text-right">Giờ</th>
                </tr>
              </thead>
              <tbody>
                {(staffPerformance?.staffs ?? []).map((x: any) => (
                  <tr key={x.staffId} className="border-b last:border-b-0">
                    <td className="py-2 pr-2">
                      {x.staffCode || "—"}
                      {x.position ? (
                        <span className="ml-2 text-xs text-gray-500">
                          {x.position}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2 pr-2 text-right">{x.ordersHandled}</td>
                    <td className="py-2 pr-2 text-right">
                      {formatMoney(x.tipsTotal)} ₫
                    </td>
                    <td className="py-2 pr-2 text-right">
                      {Number(x.hoursWorked ?? 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
                {(!staffPerformance?.staffs ||
                  staffPerformance.staffs.length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-3 text-center text-gray-500">
                      Không có dữ liệu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Tổng lương trong kỳ" icon={<Wallet size={18} />}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Tổng giờ</div>
              <div className="mt-1 text-lg font-semibold">
                {Number(payrollSummary?.totalHours ?? 0).toFixed(2)}
              </div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Gross pay</div>
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
              <div className="text-xs text-gray-500">Net pay</div>
              <div className="mt-1 text-lg font-semibold">
                {formatMoney(payrollSummary?.netPay)} ₫
              </div>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
