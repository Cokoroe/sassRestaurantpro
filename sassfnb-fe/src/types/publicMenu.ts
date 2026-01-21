// src/types/publicMenu.ts

export type PublicMenuTreeResponse = {
  outletId: string;
  currency: string; // "VND"
  at: string; // Instant ISO
  categories: PublicCategoryNode[];
};

export type PublicCategoryNode = {
  id: string;
  name: string;
  sortOrder: number | null;
  items: PublicItemNode[];
};

export type PublicItemNode = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  basePrice: string; // BigDecimal -> string
  options: PublicOptionNode[];
};

export type PublicOptionNode = {
  id: string;
  name: string;
  required: boolean | null;
  multiSelect: boolean | null; // BE có field này nhưng hiện public order enforce SINGLE
  values: PublicOptionValueNode[];
};

export type PublicOptionValueNode = {
  id: string;
  name: string;
  extraPrice: string; // BigDecimal -> string
  sortOrder: number | null;
};
