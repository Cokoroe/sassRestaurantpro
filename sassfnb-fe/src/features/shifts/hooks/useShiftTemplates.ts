import { useCallback, useEffect, useState } from "react";
import { shiftService } from "../../../api/services/shift.service";
import type { ShiftTemplate } from "../../../types/shift";
import { useCtxIds } from "./_getCtxIds";

export function useShiftTemplates() {
  const { outletId } = useCtxIds();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ShiftTemplate[]>([]);

  const refresh = useCallback(async () => {
    if (!outletId) return;
    setLoading(true);
    try {
      const res = await shiftService.listTemplates({ outletId });
      setRows(res ?? []);
    } finally {
      setLoading(false);
    }
  }, [outletId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { outletId, loading, rows, refresh };
}
