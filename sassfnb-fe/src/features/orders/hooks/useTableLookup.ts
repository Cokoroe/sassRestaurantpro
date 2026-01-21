// src/features/orders/hooks/useTableLookup.ts
import { useEffect, useMemo, useState } from "react";
import TableService from "../../../api/services/table.service";
import type { Table } from "../../../types/table";

export function useTableLookup(outletId?: string | null) {
  const [loading, setLoading] = useState(false);
  const [tables, setTables] = useState<Table[]>([]);

  useEffect(() => {
    const run = async () => {
      if (!outletId) {
        setTables([]);
        return;
      }
      setLoading(true);
      try {
        // lấy đủ lớn để map (tuỳ hệ thống, bạn chỉnh size nếu cần)
        const res = await TableService.list({ outletId, page: 0, size: 500 });
        setTables(res?.content ?? []);
      } catch {
        setTables([]);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [outletId]);

  const map = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of tables) {
      const label =
        (t.name && t.name.trim()) ? t.name.trim() : `BÀN#${t.code}`;
      m.set(t.id, label);
    }
    return m;
  }, [tables]);

  const getLabel = (tableId?: string | null) => {
    if (!tableId) return "---";
    return map.get(tableId) ?? `Bàn#${tableId.slice(0, 6)}`;
  };

  return { loading, tables, getLabel };
}
