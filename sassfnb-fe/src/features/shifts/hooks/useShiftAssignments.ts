import { useCallback, useEffect, useMemo, useState } from "react";
import { shiftService } from "../../../api/services/shift.service";
import type { ShiftAssignment } from "../../../types/shift";
import { useCtxIds } from "./_getCtxIds";

const yyyyMMdd = (d: Date) => d.toISOString().slice(0, 10);

export function useShiftAssignments() {
  const { outletId } = useCtxIds();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ShiftAssignment[]>([]);

  // default: tuần này
  const today = useMemo(() => new Date(), []);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday
    return yyyyMMdd(d);
  });
  const [dateTo, setDateTo] = useState(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + (7 - ((d.getDay() + 6) % 7))); // next Monday
    return yyyyMMdd(d);
  });

  const [staffId, setStaffId] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  const refresh = useCallback(async () => {
    if (!outletId) return;
    if (!dateFrom || !dateTo) return;

    setLoading(true);
    try {
      const res = await shiftService.search({
        outletId,
        dateFrom,
        dateTo,
        staffId: staffId || undefined,
        status: status || undefined,
      });
      setRows(res ?? []);
    } finally {
      setLoading(false);
    }
  }, [outletId, dateFrom, dateTo, staffId, status]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    outletId,
    loading,
    rows,
    refresh,

    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,

    staffId,
    setStaffId,

    status,
    setStatus,
  };
}
