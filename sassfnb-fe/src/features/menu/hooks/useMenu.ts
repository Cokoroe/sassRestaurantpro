// src/features/menu/hooks/useMenu.ts
import { useCallback, useEffect, useState } from "react";
import { MenuService } from "../../../api/services/menu.service";
import { useAppContextStore } from "../../../store/useAppContextStore";
import type {
  CategoryCreateRequest,
  CategoryResponse,
  CategoryUpdateRequest,
  ItemCreateRequest,
  ItemDetailResponse,
  ItemResponse,
  ItemUpdateRequest,
  OptionCreateRequest,
  OptionUpdateRequest,
  OptionValueCreateRequest,
  OptionValueUpdateRequest,
  Status,
} from "../../../types/menu";

export function useMenu() {
  const outletId = useAppContextStore((s) => s.outletId);

  const [error, setError] = useState<string | null>(null);

  // categories
  const [loadingCats, setLoadingCats] = useState(false);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | "ALL">(
    "ALL"
  );

  // items
  const [loadingItems, setLoadingItems] = useState(false);
  const [items, setItems] = useState<ItemResponse[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Status | "">("");

  // detail
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detail, setDetail] = useState<ItemDetailResponse | null>(null);

  const loadCategories = useCallback(async () => {
    if (!outletId) {
      setCategories([]);
      return;
    }
    try {
      setError(null);
      setLoadingCats(true);
      const res = await MenuService.listCategories({ outletId, page: 0, size: 200 });
      // axios wrapper -> res.data
      setCategories((res as any).data?.content ?? (res as any).content ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Load categories failed");
    } finally {
      setLoadingCats(false);
    }
  }, [outletId]);

  const loadItems = useCallback(async () => {
    if (!outletId) {
      setItems([]);
      return;
    }
    try {
      setError(null);
      setLoadingItems(true);

      const categoryId =
        selectedCategoryId === "ALL" ? undefined : selectedCategoryId;

      const res = await MenuService.listItems({
        outletId,
        q: q.trim() || undefined,
        status: status || undefined,
        categoryId,
        page: 0,
        size: 200,
      });

      setItems((res as any).data?.content ?? (res as any).content ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Load items failed");
    } finally {
      setLoadingItems(false);
    }
  }, [outletId, selectedCategoryId, q, status]);

  const loadDetail = useCallback(async () => {
    if (!selectedItemId || !outletId) {
      setDetail(null);
      return;
    }
    try {
      setError(null);
      setLoadingDetail(true);
      const res = await MenuService.getItemDetail(selectedItemId, { outletId });
      setDetail((res as any).data ?? res ?? null);
    } catch (e: any) {
      setError(e?.message ?? "Load item detail failed");
    } finally {
      setLoadingDetail(false);
    }
  }, [selectedItemId, outletId]);

  useEffect(() => {
    setSelectedCategoryId("ALL");
    setSelectedItemId(null);
    setDetail(null);
    setQ("");
    setStatus("");
  }, [outletId]);

  useEffect(() => void loadCategories(), [loadCategories]);
  useEffect(() => void loadItems(), [loadItems]);
  useEffect(() => void loadDetail(), [loadDetail]);

  useEffect(() => {
    setSelectedItemId(null);
    setDetail(null);
  }, [selectedCategoryId]);

  // CATEGORY ACTIONS
  const createCategory = useCallback(
    async (payload: Omit<CategoryCreateRequest, "outletId">) => {
      if (!outletId) return;
      await MenuService.createCategory({ outletId, ...payload });
      await loadCategories();
    },
    [outletId, loadCategories]
  );

  const updateCategory = useCallback(
    async (id: string, payload: CategoryUpdateRequest) => {
      await MenuService.updateCategory(id, payload);
      await loadCategories();
    },
    [loadCategories]
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      await MenuService.deleteCategory(id, false);
      await loadCategories();
    },
    [loadCategories]
  );

  // ITEM ACTIONS
  const createItem = useCallback(
    async (payload: Omit<ItemCreateRequest, "outletId">): Promise<ItemResponse> => {
      if (!outletId) throw new Error("Missing outletId");
      const res = await MenuService.createItem({ outletId, ...payload });
      const created = (res as any).data ?? res;
      await loadItems();
      return created as ItemResponse;
    },
    [outletId, loadItems]
  );

  const updateItem = useCallback(
    async (id: string, payload: ItemUpdateRequest) => {
      await MenuService.updateItem(id, payload);
      await loadItems();
      if (selectedItemId === id) await loadDetail();
    },
    [loadItems, loadDetail, selectedItemId]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      await MenuService.deleteItem(id);
      await loadItems();
      if (selectedItemId === id) {
        setSelectedItemId(null);
        setDetail(null);
      }
    },
    [loadItems, selectedItemId]
  );

  const duplicateItem = useCallback(
    async (id: string) => {
      await MenuService.duplicateItem(id);
      await loadItems();
    },
    [loadItems]
  );

  const publishItem = useCallback(
    async (id: string, next: "ACTIVE" | "INACTIVE") => {
      await MenuService.publishItem(id, { status: next });
      await loadItems();
      if (selectedItemId === id) await loadDetail();
    },
    [loadItems, loadDetail, selectedItemId]
  );

  // ✅ upload image (không dùng /uploads nữa)
  const uploadItemImage = useCallback(async (id: string, file: File) => {
    const res = await MenuService.uploadItemImage(id, file);
    const updated = (res as any).data ?? res;

    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...updated } : x)));

    setDetail((prev) => {
      if (!prev?.item || prev.item.id !== id) return prev;
      return { ...prev, item: { ...prev.item, ...updated } };
    });
  }, []);

  // OPTION ACTIONS
  const createOption = useCallback(
    async (itemId: string, payload: OptionCreateRequest) => {
      await MenuService.addOption(itemId, payload);
      await loadDetail();
    },
    [loadDetail]
  );

  const updateOption = useCallback(
    async (optionId: string, payload: OptionUpdateRequest) => {
      await MenuService.updateOption(optionId, payload);
      await loadDetail();
    },
    [loadDetail]
  );

  const deleteOption = useCallback(
    async (optionId: string) => {
      await MenuService.deleteOption(optionId);
      await loadDetail();
    },
    [loadDetail]
  );

  const createOptionValue = useCallback(
    async (optionId: string, payload: OptionValueCreateRequest) => {
      await MenuService.addValue(optionId, payload);
      await loadDetail();
    },
    [loadDetail]
  );

  const updateOptionValue = useCallback(
    async (valueId: string, payload: OptionValueUpdateRequest) => {
      await MenuService.updateValue(valueId, payload);
      await loadDetail();
    },
    [loadDetail]
  );

  const deleteOptionValue = useCallback(
    async (valueId: string) => {
      await MenuService.deleteValue(valueId);
      await loadDetail();
    },
    [loadDetail]
  );

  return {
    outletId: outletId ?? "",

    error,
    setError,

    loadingCats,
    categories,
    selectedCategoryId,
    setSelectedCategoryId,
    createCategory,
    updateCategory,
    deleteCategory,

    loadingItems,
    items,
    selectedItemId,
    setSelectedItemId,
    q,
    setQ,
    status,
    setStatus,
    createItem,
    updateItem,
    deleteItem,
    duplicateItem,
    publishItem,
    uploadItemImage,

    loadingDetail,
    detail,
    createOption,
    updateOption,
    deleteOption,
    createOptionValue,
    updateOptionValue,
    deleteOptionValue,

    reloadCategories: loadCategories,
    reloadItems: loadItems,
    reloadDetail: loadDetail,
  };
}
