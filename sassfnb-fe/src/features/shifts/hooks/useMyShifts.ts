import { useCallback, useEffect, useState } from "react";
import { shiftService } from "../../../api/services/shift.service";
import type { ShiftAssignment } from "../../../types/shift";

export function useMyShifts() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ShiftAssignment[]>([]);

  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await shiftService.myShifts({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        status: status || undefined,
      });
      setRows(res ?? []);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, status]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { loading, rows, refresh, dateFrom, setDateFrom, dateTo, setDateTo, status, setStatus };
}
