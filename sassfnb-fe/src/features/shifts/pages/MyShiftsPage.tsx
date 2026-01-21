import { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import type { AppLayoutContext } from "../../../layout/AppLayout";
import { useMyShifts } from "../hooks/useMyShifts";

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "ASSIGNED"
      ? "bg-slate-50 text-slate-700 border-slate-200"
      : status === "CANCELED"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : status === "CLOSED" || status === "DONE"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-amber-50 text-amber-800 border-amber-200";
  return (
    <span className={`inline-flex px-2 py-1 rounded-lg border ${cls}`}>
      {status}
    </span>
  );
}

export default function MyShiftsPage() {
  const { setTitle } = useOutletContext<AppLayoutContext>();
  useMemo(() => setTitle?.("Lịch của tôi (My Shifts)"), [setTitle]);

  const m = useMyShifts();

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl border bg-white">
        <div className="font-semibold">Bộ lọc</div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="text-sm text-slate-600">Từ ngày</label>
            <input
              type="date"
              className="w-full border rounded-xl px-3 py-2"
              value={m.dateFrom}
              onChange={(e) => m.setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-slate-600">Đến ngày</label>
            <input
              type="date"
              className="w-full border rounded-xl px-3 py-2"
              value={m.dateTo}
              onChange={(e) => m.setDateTo(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-slate-600">Status</label>
            <select
              className="w-full border rounded-xl px-3 py-2 bg-white"
              value={m.status}
              onChange={(e) => m.setStatus(e.target.value)}
            >
              <option value="">ALL</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="CANCELED">CANCELED</option>
              <option value="CLOSED">CLOSED</option>
              <option value="DONE">DONE</option>
            </select>
          </div>
          <button
            className="px-4 py-2 rounded-xl bg-slate-900 text-white disabled:opacity-50"
            onClick={m.refresh}
            disabled={m.loading}
          >
            Tải
          </button>
        </div>
      </div>

      <div className="rounded-2xl border bg-white overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="font-semibold">My assignments</div>
          <div className="text-sm text-slate-600">
            {m.loading ? "Đang tải..." : `${m.rows.length} ca`}
          </div>
        </div>

        <div className="overflow-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr className="text-left">
                <th className="p-3">Date</th>
                <th className="p-3">Template</th>
                <th className="p-3">Time</th>
                <th className="p-3">Break</th>
                <th className="p-3">Status</th>
                <th className="p-3">Note</th>
              </tr>
            </thead>
            <tbody>
              {m.rows.map((x) => (
                <tr key={x.id} className="border-t">
                  <td className="p-3">{x.workDate}</td>
                  <td className="p-3">{x.workShiftName ?? "-"}</td>
                  <td className="p-3">
                    {String(x.startTime).slice(0, 5)} -{" "}
                    {String(x.endTime).slice(0, 5)}
                  </td>
                  <td className="p-3">{x.breakMinutes ?? 0}</td>
                  <td className="p-3">
                    <StatusBadge status={x.status} />
                  </td>
                  <td className="p-3">{x.note ?? "-"}</td>
                </tr>
              ))}

              {m.rows.length === 0 && !m.loading && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    Không có dữ liệu
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
