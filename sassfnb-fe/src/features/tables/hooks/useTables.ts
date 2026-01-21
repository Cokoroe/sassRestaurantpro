// src/features/tables/hooks/useTables.ts
import { useCallback, useEffect, useMemo, useState } from "react";
import TableService from "../../../api/services/table.service";
import type {
  Table,
  TableCreatePayload,
  TableListParams,
  TableUpdatePayload,
  DynamicQrDto,
  StaticQrDto,
} from "../../../types/table";

const DEFAULT_SIZE = 10;

export function useTables() {
  const outletId = localStorage.getItem("outlet_id") || "";

  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Table[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_SIZE);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");
  const [groupCode, setGroupCode] = useState<string>("");

  const [selected, setSelected] = useState<Table | null>(null);

  const [dynamicQr, setDynamicQr] = useState<DynamicQrDto | null>(null);
  const [staticQr, setStaticQr] = useState<StaticQrDto | null>(null);

  const params: TableListParams = useMemo(
    () => ({
      outletId,
      q: q || undefined,
      status: status || undefined,
      groupCode: groupCode || undefined,
      page,
      size,
    }),
    [outletId, q, status, groupCode, page, size]
  );

  const canLoad = Boolean(outletId);

  const fetchList = useCallback(async () => {
    if (!canLoad) return;
    setLoading(true);
    try {
      const res = await TableService.list(params);
      setList(res.content ?? []);
      setTotalElements(res.totalElements ?? 0);

      // Auto select first if none selected or selected not in list
      setSelected((cur) => {
        if (!cur) return (res.content ?? [])[0] ?? null;
        const still = (res.content ?? []).find((t) => t.id === cur.id);
        return still ?? (res.content ?? [])[0] ?? null;
      });
    } finally {
      setLoading(false);
    }
  }, [canLoad, params]);

  const fetchQrPanels = useCallback(async (tableId: string) => {
    const [d, s] = await Promise.all([
      TableService.getDynamicQr(tableId).catch(() => null),
      TableService.getStaticQr(tableId).catch(() => null),
    ]);
    setDynamicQr(d);
    setStaticQr(s);
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (selected?.id) fetchQrPanels(selected.id);
    else {
      setDynamicQr(null);
      setStaticQr(null);
    }
  }, [selected?.id, fetchQrPanels]);

  const clearFilters = () => {
    setQ("");
    setStatus("");
    setGroupCode("");
    setPage(0);
  };

  const reload = async () => {
    await fetchList();
    if (selected?.id) await fetchQrPanels(selected.id);
  };

  // ===== CRUD =====
  const createTable = async (payload: Omit<TableCreatePayload, "outletId">) => {
    if (!outletId) throw new Error("Chưa có outletId. Hãy chọn Outlet trước.");
    const created = await TableService.create({ ...payload, outletId });
    await fetchList();
    setSelected(created);
    return created;
  };

  const updateTable = async (id: string, payload: TableUpdatePayload) => {
    const updated = await TableService.update(id, payload);
    await fetchList();
    setSelected(updated);
    return updated;
  };

  const deleteTable = async (id: string) => {
    await TableService.delete(id);
    await fetchList();
    // selected tự được auto select lại ở fetchList
  };

  // ===== QR dynamic =====
  const rotateDynamic = async (ttlMinutes?: number) => {
    if (!selected?.id) throw new Error("Chưa chọn bàn");
    const res = await TableService.rotateDynamicQr(selected.id, { ttlMinutes });
    setDynamicQr(res);
    await fetchList(); // để list cập nhật currentQrToken/expiresAt nếu muốn
    return res;
  };

  const disableDynamic = async () => {
    if (!selected?.id) throw new Error("Chưa chọn bàn");
    await TableService.disableDynamicQr(selected.id);
    setDynamicQr({ token: null, expiresAt: null, qrUrl: null });
    await fetchList();
  };

  // ===== QR static =====
  const generateStatic = async (size?: number, force?: boolean) => {
    if (!selected?.id) throw new Error("Chưa chọn bàn");
    const res = await TableService.generateStaticQr(selected.id, {
      size,
      force: !!force,
    });
    setStaticQr(res);
    return res;
  };

  const refreshStatic = async (size?: number) => {
    if (!selected?.id) throw new Error("Chưa chọn bàn");
    const res = await TableService.refreshStaticQr(selected.id, { size });
    setStaticQr(res);
    return res;
  };

  return {
    outletId,
    loading,
    list,
    totalElements,
    page,
    size,
    setPage,
    setSize,

    q,
    setQ,
    status,
    setStatus,
    groupCode,
    setGroupCode,
    clearFilters,

    selected,
    setSelected,

    dynamicQr,
    staticQr,

    reload,
    createTable,
    updateTable,
    deleteTable,

    rotateDynamic,
    disableDynamic,

    generateStatic,
    refreshStatic,
  };
}
