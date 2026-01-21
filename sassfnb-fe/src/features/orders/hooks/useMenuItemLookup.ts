import { useEffect, useMemo, useState } from "react";
import { MenuService } from "../../../api/services/menu.service";
import type { ItemResponse } from "../../../types/menu";

export function useMenuItemLookup(outletId?: string | null) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ItemResponse[]>([]);

  useEffect(() => {
    const run = async () => {
      if (!outletId) {
        setItems([]);
        return;
      }
      setLoading(true);
      try {
        // lấy đủ lớn để map (tuỳ hệ thống, chỉnh size nếu menu nhiều)
        const res = await MenuService.listItems({
          outletId,
          page: 0,
          size: 2000,
          status: "ACTIVE",
        });
        setItems(res?.content ?? []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [outletId]);

  const map = useMemo(() => {
    const m = new Map<string, string>();
    for (const it of items) {
      const name = (it.name ?? "").trim();
      if (name) m.set(it.id, name);
    }
    return m;
  }, [items]);

  const getName = (menuItemId?: string | null) => {
    if (!menuItemId) return "---";
    return map.get(menuItemId) ?? `Món#${menuItemId.slice(0, 6)}`;
  };

  return { loading, items, getName };
}
