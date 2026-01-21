// src/api/services/menu.service.ts
import { http } from "../client";
import type { PageResponse } from "../../types/page";
import type {
  CategoryCreateRequest,
  CategoryResponse,
  CategoryTreeNode,
  CategoryUpdateRequest,
  DuplicateItemResponse,
  ItemCreateRequest,
  ItemDetailResponse,
  ItemPublishPatchRequest,
  ItemResponse,
  ItemUpdateRequest,
  OptionCreateRequest,
  OptionResponse,
  OptionUpdateRequest,
  OptionValueCreateRequest,
  OptionValueResponse,
  OptionValueUpdateRequest,
  PriceCreateRequest,
  PriceResponse,
  PriceUpdateRequest,
} from "../../types/menu";

// ====== DELETE helper (compatible với wrapper khác nhau)
const del = (url: string, config?: any) => {
  const anyHttp: any = http as any;
  if (typeof anyHttp.del === "function") return anyHttp.del(url, config);
  if (typeof anyHttp.delete === "function") return anyHttp.delete(url, config);
  if (typeof anyHttp.remove === "function") return anyHttp.remove(url, config);
  return anyHttp.request?.({ method: "DELETE", url, ...(config ?? {}) });
};

export const MenuService = {
  // =======================
  // CATEGORIES
  // =======================
  listCategories: (params: {
    outletId?: string;
    q?: string;
    status?: string;
    page?: number;
    size?: number;
    sort?: string;
  }) =>
    http.get<PageResponse<CategoryResponse>>("/menu/categories", {
      params,
    }),

  createCategory: (payload: CategoryCreateRequest) =>
    http.post<CategoryResponse>("/menu/categories", payload),

  getCategory: (id: string) =>
    http.get<CategoryResponse>(`/menu/categories/${id}`),

  updateCategory: (id: string, payload: CategoryUpdateRequest) =>
    http.put<CategoryResponse>(`/menu/categories/${id}`, payload),

  deleteCategory: (id: string, cascade = false) =>
    del(`/menu/categories/${id}`, { params: { cascade } }),

  reorderCategory: (id: string, sortOrder: number) =>
    http.patch<void>(`/menu/categories/${id}/reorder`, { sortOrder }),

  treeCategories: (status?: string) =>
    http.get<CategoryTreeNode[]>("/menu/categories/tree", {
      params: { status },
    }),

  // =======================
  // ITEMS
  // =======================
  listItems: (params: {
    q?: string;
    categoryId?: string;
    status?: string;
    isFeatured?: boolean;
    outletId?: string;
    hasOptions?: boolean;
    page?: number;
    size?: number;
    sort?: string;
  }) => http.get<PageResponse<ItemResponse>>("/menu/items", { params }),

  createItem: (payload: ItemCreateRequest) => {
    return http.post<ItemResponse>("/menu/items", {
      ...payload,
      basePrice: Number(payload.basePrice),
    });
  },

  getItemDetail: (id: string, params?: { outletId?: string; at?: string }) =>
    http.get<ItemDetailResponse>(`/menu/items/${id}`, { params }),

  updateItem: (id: string, payload: ItemUpdateRequest) =>
    http.put<ItemResponse>(`/menu/items/${id}`, payload),

  publishItem: (id: string, payload: ItemPublishPatchRequest) =>
    http.patch<ItemResponse>(`/menu/items/${id}/publish`, payload),

  deleteItem: (id: string) => del(`/menu/items/${id}`),

  duplicateItem: (id: string) =>
    http.post<DuplicateItemResponse>(`/menu/items/${id}/duplicate`),

  // =======================
  // ✅ UPLOAD IMAGE (FIX 404)
  // =======================
  uploadItemImage: (itemId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return http.post<ItemResponse>(`/menu/items/${itemId}/image`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // =======================
  // OPTIONS + VALUES
  // =======================
  listOptionsByItem: (itemId: string) =>
    http.get<OptionResponse[]>(`/menu/options/by-item/${itemId}`),

  addOption: (itemId: string, payload: OptionCreateRequest) =>
    http.post<OptionResponse>(`/menu/options/item/${itemId}`, payload),

  updateOption: (optionId: string, payload: OptionUpdateRequest) =>
    http.put<OptionResponse>(`/menu/options/${optionId}`, payload),

  deleteOption: (optionId: string) => del(`/menu/options/${optionId}`),

  // ✅ VALUES: ép kiểu number + normalize payload
  listValues: (optionId: string) =>
    http.get<OptionValueResponse[]>(`/menu/options/${optionId}/values`),

  addValue: (optionId: string, payload: OptionValueCreateRequest) =>
    http.post<OptionValueResponse>(`/menu/options/${optionId}/values`, {
      ...payload,
      extraPrice:
        payload.extraPrice === null || payload.extraPrice === undefined
          ? payload.extraPrice
          : Number(payload.extraPrice),
      sortOrder:
        payload.sortOrder === null || payload.sortOrder === undefined
          ? payload.sortOrder
          : Number(payload.sortOrder),
    }),

  updateValue: (valueId: string, payload: OptionValueUpdateRequest) =>
    http.put<OptionValueResponse>(`/menu/options/values/${valueId}`, {
      ...payload,
      extraPrice:
        payload.extraPrice === null || payload.extraPrice === undefined
          ? payload.extraPrice
          : Number(payload.extraPrice),
      sortOrder:
        payload.sortOrder === null || payload.sortOrder === undefined
          ? payload.sortOrder
          : Number(payload.sortOrder),
    }),

  deleteValue: (valueId: string) => del(`/menu/options/values/${valueId}`),

  // =======================
  // PRICES
  // =======================
  listPrices: (itemId: string, outletId?: string) =>
    http.get<PriceResponse[]>(`/menu/items/${itemId}/prices`, {
      params: { outletId },
    }),

  createPrice: (itemId: string, payload: PriceCreateRequest) =>
    http.post<PriceResponse>(`/menu/items/${itemId}/prices`, {
      ...payload,
      basePrice: Number(payload.basePrice),
    }),

  updatePrice: (itemId: string, priceId: string, payload: PriceUpdateRequest) =>
    http.put<PriceResponse>(`/menu/items/${itemId}/prices/${priceId}`, {
      ...payload,
      basePrice:
        payload.basePrice === null || payload.basePrice === undefined
          ? payload.basePrice
          : Number(payload.basePrice),
    }),

  deletePrice: (itemId: string, priceId: string) =>
    del(`/menu/items/${itemId}/prices/${priceId}`),

  getEffectivePrice: (itemId: string, outletId?: string, at?: string) =>
    http.get<PriceResponse>(`/menu/items/${itemId}/price-effective`, {
      params: { outletId, at },
    }),
};
