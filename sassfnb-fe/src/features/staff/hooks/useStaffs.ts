import { useCallback, useEffect, useMemo, useState } from "react";
import { staffService } from "../../../api/services/staff.service";
import type { Staff, StaffListParams, StaffStatus } from "../../../types/staff";
import { useAppContextStore } from "../../../store/useAppContextStore";

const getCtxIds = (s: any) => {
  const outletId =
    s.currentOutletId ||
    s.outletId ||
    s.selectedOutletId ||
    s.currentOutlet?.id ||
    s.outlet?.id ||
    null;

  const restaurantId =
    s.currentRestaurantId ||
    s.restaurantId ||
    s.selectedRestaurantId ||
    s.currentRestaurant?.id ||
    s.restaurant?.id ||
    null;

  return { outletId, restaurantId };
};

export function useStaffs() {
  const ctx = useAppContextStore();
  const { outletId, restaurantId } = useMemo(() => getCtxIds(ctx as any), [ctx]);

  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | StaffStatus>("");

  const [rows, setRows] = useState<Staff[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((totalElements || 0) / (size || 20))),
    [totalElements, size]
  );

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params: StaffListParams = {
        restaurantId: restaurantId || undefined,
        outletId: outletId || undefined,
        q: q?.trim() ? q.trim() : undefined,
        status: status || undefined,
        page,
        size,
      };

      const res = await staffService.list(params);
      setRows(res.content ?? []);
      setTotalElements(res.totalElements ?? 0);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, outletId, q, status, page, size]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const applyFilters = useCallback(() => {
    setPage(0);
  }, []);

  return {
    outletId,
    restaurantId,

    loading,
    rows,
    totalElements,
    totalPages,

    page,
    setPage,
    size,
    setSize,

    q,
    setQ,
    status,
    setStatus,
    applyFilters,

    refresh: fetchList,
  };
}
