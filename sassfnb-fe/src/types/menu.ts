// src/types/menu.ts

// BE hiện dùng ACTIVE/INACTIVE cho item/category publish, soft delete item cũng set INACTIVE.
// => Không nên dùng DELETED ở FE nếu BE không trả.
export type Status = "ACTIVE" | "INACTIVE";
export type EntityStatus = "ACTIVE" | "INACTIVE" | "DELETED";
// =====================
// CATEGORY
// =====================
export type CategoryListRequest = {
  outletId?: string | null;
  q?: string | null;
  status?: EntityStatus | "" | null;
};

export type CategoryResponse = {
  id: string;
  name: string;
  sortOrder?: number | null;
  status: EntityStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type CategoryCreateRequest = {
  outletId?: string | null;
  name: string;
  sortOrder?: number | null;
  status?: EntityStatus | null;
};

export type CategoryUpdateRequest = {
  name?: string | null;
  sortOrder?: number | null;
  status?: EntityStatus | null;
};

export type CategoryReorderRequest = {
  sortOrder: number;
};

export type CategoryTreeNode = {
  id: string;
  name: string;
  sortOrder?: number | null;
  status: EntityStatus;
  children: CategoryTreeNode[];
};

// =====================
// ITEM
// =====================
export type ItemListRequest = {
  q?: string | null;
  categoryId?: string | null;
  status?: Status | "" | null;
  isFeatured?: boolean | null;
  outletId?: string | null;
  hasOptions?: boolean | null;
};

export type ItemCreateRequest = {
  outletId?: string | null;
  name: string;
  code?: string | null;
  categoryId: string;
  description?: string | null;
  imageUrl?: string | null;
  status?: Status | null;
  basePrice: number; // ✅ bắt buộc
  tags?: string[] | null;
};

export type ItemUpdateRequest = {
  name?: string | null;
  categoryId?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  status?: Status | null;
  tags?: string[] | null;
};

export type ItemPublishPatchRequest = {
  status: Status;
};

export type ItemResponse = {
  id: string;
  name: string;
  code: string;
  categoryId?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  status: Status;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type DuplicateItemResponse = {
  newItemId: string;
};

// =====================
// PRICE (FE type giữ theo route, nhưng BE hiện ignore outletId & isActive)
// =====================
export type PriceCreateRequest = {
  outletId?: string | null; // BE đang không dùng, vẫn để optional
  currency?: string | null; // BE map vào variantName
  basePrice: number;
  takeawayPrice?: number | null; // BE bỏ, vẫn để optional
  startAt?: string | null;
  endAt?: string | null;
  isActive?: boolean | null; // BE bỏ
};

export type PriceUpdateRequest = {
  currency?: string | null;
  basePrice?: number | null;
  takeawayPrice?: number | null; // BE bỏ
  startAt?: string | null;
  endAt?: string | null;
  isActive?: boolean | null; // BE bỏ
};

// BE activatePrice throw -> không dùng nữa
export type PriceActivatePatchRequest = {
  isActive: boolean;
};

export type PriceResponse = {
  id: string;
  itemId: string;
  outletId?: string | null; // BE trả null
  currency?: string | null; // BE dùng variantName
  basePrice: number; // BE p.getPrice()
  takeawayPrice?: number | null; // BE trả null
  startAt?: string | null;
  endAt?: string | null;
  isActive?: boolean | null; // BE trả true
  createdAt?: string;
  updatedAt?: string;
};

// =====================
// OPTIONS
// =====================
export type OptionCreateRequest = {
  name: string;
  required?: boolean | null;
  multiSelect?: boolean | null;
  minSelect?: number | null;
  maxSelect?: number | null;
};

export type OptionUpdateRequest = {
  name?: string | null;
  required?: boolean | null;
  multiSelect?: boolean | null;
  minSelect?: number | null;
  maxSelect?: number | null;
};

export type OptionResponse = {
  id: string;
  itemId: string;
  name: string;
  required: boolean;
  multiSelect: boolean;
  minSelect?: number | null;
  maxSelect?: number | null;
};

export type OptionValueCreateRequest = {
  name: string;
  extraPrice?: number | null;
  sortOrder?: number | null;
};

export type OptionValueUpdateRequest = {
  name?: string | null;
  extraPrice?: number | null;
  sortOrder?: number | null;
};

export type OptionValueResponse = {
  id: string;
  optionId: string;
  name: string;
  extraPrice?: number | null;
  sortOrder?: number | null;
};

export type OptionValueGrouped = {
  optionId: string;
  optionName: string;
  values: OptionValueResponse[];
};

export type ItemDetailResponse = {
  item: ItemResponse;
  options: OptionResponse[];
  optionValues: OptionValueGrouped[];
  effectivePrice?: PriceResponse | null;
};
