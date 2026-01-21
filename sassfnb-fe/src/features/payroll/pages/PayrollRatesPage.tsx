import { useEffect, useMemo, useState } from "react";
import { useAppContextStore } from "../../../store/useAppContextStore";
import { staffService } from "../../../api/services/staff.service";
import { payrollService } from "../../../api/services/payroll.service";
import type { StaffOption } from "../../../types/staff";
import type {
  PayRateResponse,
  PayRateUpsertRequest,
} from "../../../types/payroll";
import StaffDropdown, { type StaffLike } from "../components/StaffDropdown";

const todayISO = () => new Date().toISOString().slice(0, 10);

const fmtMoney = (n: number) =>
  Number.isFinite(n)
    ? n.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : "0";

function pickFirstString(obj: any, keys: string[]) {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

export default function PayrollRatesPage() {
  const outletId = useAppContextStore((s) => s.outletId);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [rows, setRows] = useState<PayRateResponse[]>([]);

  const [filterStaffId, setFilterStaffId] = useState<string>("");
  const [filterAt, setFilterAt] = useState<string>("");

  const [editing, setEditing] = useState<PayRateResponse | null>(null);

  const [form, setForm] = useState<{
    staffId: string;
    hourlyRate: string;
    effectiveFrom: string;
    effectiveTo: string;
  }>({
    staffId: "",
    hourlyRate: "",
    effectiveFrom: todayISO(),
    effectiveTo: "",
  });

  // --------- Build label maps (options + rows fallback) ---------
  const staffMetaById = useMemo(() => {
    const m = new Map<
      string,
      { name?: string | null; code?: string | null; email?: string | null }
    >();

    // 1) from staffOptions (ưu tiên)
    for (const s of staffOptions as any[]) {
      const name =
        pickFirstString(s, [
          "name",
          "fullName",
          "staffName",
          "userFullName",
          "label",
          "displayName",
        ]) ||
        (s?.name ?? null);
      const code = pickFirstString(s, ["code", "staffCode", "staff_code"]);
      const email = pickFirstString(s, ["email", "staffEmail", "userEmail"]);
      m.set(s.id, {
        name: name || null,
        code: code || null,
        email: email || null,
      });
    }

    // 2) fallback from pay-rate rows (vì rows chắc chắn có staffName/staffCode nếu BE đã trả)
    for (const r of rows ?? []) {
      if (!m.has(r.staffId)) {
        m.set(r.staffId, {
          name: r.staffName ?? null,
          code: r.staffCode ?? null,
          email: r.staffEmail ?? null,
        });
      }
    }

    return m;
  }, [staffOptions, rows]);

  const displayStaffName = (staffId: string) => {
    const meta = staffMetaById.get(staffId);
    const name = meta?.name?.trim();
    const code = meta?.code?.trim();
    const email = meta?.email?.trim();

    if (name) {
      if (code) return `${name} (${code})`;
      if (email) return `${name} - ${email}`;
      return name;
    }
    if (code) return code;
    if (email) return email;
    return staffId;
  };

  // --------- load staff options ----------
  const loadStaffOptions = async () => {
    if (!outletId) return;
    try {
      const opts = await staffService.options(outletId);
      setStaffOptions(opts ?? []);
    } catch {
      // ignore
    }
  };

  // --------- load rates ----------
  const loadRates = async () => {
    if (!outletId) return;
    setLoading(true);
    setErr(null);
    try {
      const data = await payrollService.listRates({
        outletId,
        staffId: filterStaffId || undefined,
        at: filterAt || undefined,
      });
      setRows(data ?? []);
    } catch (e: any) {
      setErr(
        e?.response?.data?.message ?? e?.message ?? "Load pay rates failed",
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
    loadRates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outletId, filterStaffId, filterAt]);

  // --------- dropdown options: merge staffOptions + rows staffId fallback ----------
  const staffDropdownOptions: StaffLike[] = useMemo(() => {
    const map = new Map<string, StaffLike>();

    // 1) staffOptions first
    for (const s of staffOptions as any[]) {
      map.set(s.id, {
        id: s.id,
        name:
          pickFirstString(s, [
            "name",
            "fullName",
            "staffName",
            "userFullName",
            "label",
            "displayName",
          ]) || s.name,
        code: pickFirstString(s, ["code", "staffCode", "staff_code"]) || s.code,
        email:
          pickFirstString(s, ["email", "staffEmail", "userEmail"]) || s.email,
      });
    }

    // 2) ensure any staffId appears in dropdown by falling back to rows
    for (const r of rows ?? []) {
      if (!map.has(r.staffId)) {
        map.set(r.staffId, {
          id: r.staffId,
          name: r.staffName ?? null,
          code: r.staffCode ?? null,
          email: r.staffEmail ?? null,
        });
      }
    }

    // sort friendly by name/code
    return Array.from(map.values()).sort((a, b) => {
      const an = (a.name ?? a.code ?? a.email ?? a.id).toString().toLowerCase();
      const bn = (b.name ?? b.code ?? b.email ?? b.id).toString().toLowerCase();
      return an.localeCompare(bn);
    });
  }, [staffOptions, rows]);

  const resetForm = () => {
    setEditing(null);
    setForm({
      staffId: "",
      hourlyRate: "",
      effectiveFrom: todayISO(),
      effectiveTo: "",
    });
  };

  const startEdit = (r: PayRateResponse) => {
    setEditing(r);
    setForm({
      staffId: r.staffId,
      hourlyRate: String(r.hourlyRate ?? ""),
      effectiveFrom: r.effectiveFrom ?? todayISO(),
      effectiveTo: r.effectiveTo ?? "",
    });
  };

  const submit = async () => {
    if (!outletId) return setErr("Bạn chưa chọn outlet");
    setErr(null);

    if (!form.staffId) return setErr("Vui lòng chọn staff");
    if (!form.hourlyRate) return setErr("Vui lòng nhập hourly rate");
    if (!form.effectiveFrom) return setErr("Vui lòng chọn effectiveFrom");

    const payload: PayRateUpsertRequest = {
      staffId: form.staffId,
      outletId,
      hourlyRate: Number(form.hourlyRate),
      effectiveFrom: form.effectiveFrom,
      effectiveTo: form.effectiveTo ? form.effectiveTo : null,
    };

    setLoading(true);
    try {
      if (editing) await payrollService.updateRate(editing.id, payload);
      else await payrollService.createRate(payload);

      resetForm();
      await loadRates();
    } catch (e: any) {
      setErr(
        e?.response?.data?.message ?? e?.message ?? "Save pay rate failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            Bảng lương giờ (Pay Rates)
          </h1>
          <p className="text-sm text-slate-500">
            Thiết lập hourly rate theo nhân sự & thời điểm hiệu lực.
          </p>
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

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StaffDropdown
            label="Lọc theo staff"
            value={filterStaffId}
            onChange={(v) => setFilterStaffId(v)}
            options={staffDropdownOptions}
            disabled={!outletId}
            allowAll
            allLabel="Tất cả"
          />

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Ngày áp dụng (at)
            </label>
            <input
              type="date"
              className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-slate-50"
              value={filterAt}
              onChange={(e) => setFilterAt(e.target.value)}
              disabled={!outletId}
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
              onClick={() => {
                setFilterStaffId("");
                setFilterAt("");
              }}
              disabled={!outletId}
            >
              Reset
            </button>
            <button
              className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-60"
              onClick={loadRates}
              disabled={!outletId || loading}
            >
              Tải lại
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="font-bold text-slate-800">
            {editing ? "Sửa rate" : "Tạo rate"}
          </div>
          {editing && (
            <button
              className="text-sm text-slate-600 hover:text-slate-900"
              onClick={resetForm}
            >
              Hủy sửa
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
          <StaffDropdown
            label="Staff"
            value={form.staffId}
            onChange={(v) => setForm((p) => ({ ...p, staffId: v }))}
            options={staffDropdownOptions}
            disabled={!outletId || loading}
            placeholder="Chọn staff"
          />

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Hourly rate
            </label>
            <input
              type="number"
              step="0.01"
              className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-slate-50"
              value={form.hourlyRate}
              onChange={(e) =>
                setForm((p) => ({ ...p, hourlyRate: e.target.value }))
              }
              disabled={!outletId || loading}
              placeholder="vd: 25"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Effective from
            </label>
            <input
              type="date"
              className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-slate-50"
              value={form.effectiveFrom}
              onChange={(e) =>
                setForm((p) => ({ ...p, effectiveFrom: e.target.value }))
              }
              disabled={!outletId || loading}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Effective to (optional)
            </label>
            <input
              type="date"
              className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-slate-50"
              value={form.effectiveTo}
              onChange={(e) =>
                setForm((p) => ({ ...p, effectiveTo: e.target.value }))
              }
              disabled={!outletId || loading}
            />
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-60"
            onClick={submit}
            disabled={!outletId || loading}
          >
            {editing ? "Lưu thay đổi" : "Tạo rate"}
          </button>
          <button
            className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
            onClick={resetForm}
            disabled={loading}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="font-bold text-slate-800">Danh sách rates</div>
          <div className="text-xs text-slate-500">{rows.length} dòng</div>
        </div>

        <div className="overflow-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-4 py-3">Staff</th>
                <th className="text-left px-4 py-3">Hourly rate</th>
                <th className="text-left px-4 py-3">From</th>
                <th className="text-left px-4 py-3">To</th>
                <th className="text-right px-4 py-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800">
                      {displayStaffName(r.staffId)}
                    </div>
                    <div className="text-xs text-slate-500">
                      {r.staffCode
                        ? `Mã: ${r.staffCode}`
                        : r.staffEmail
                          ? r.staffEmail
                          : ""}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    {fmtMoney(Number(r.hourlyRate ?? 0))}
                  </td>
                  <td className="px-4 py-3">{r.effectiveFrom}</td>
                  <td className="px-4 py-3">{r.effectiveTo ?? "-"}</td>

                  <td className="px-4 py-3 text-right">
                    <button
                      className="h-9 px-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                      onClick={() => startEdit(r)}
                    >
                      Sửa
                    </button>
                  </td>
                </tr>
              ))}

              {!loading && rows.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={5}>
                    Chưa có pay rate nào.
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
