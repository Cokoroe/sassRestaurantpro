// src/types/restaurant.ts
export type RestaurantStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED" | string;

export type Restaurant = {
  id: string;
  name: string;
  legalName: string | null;
  taxId: string | null;
  defaultCurrency: string;
  defaultTimezone: string;
  locale: string;
  status: RestaurantStatus;
  createdAt: string; // Instant -> string
  updatedAt: string; // Instant -> string
};

export type RestaurantCreateRequest = {
  name: string;
  legalName?: string | null;
  taxId?: string | null;
  defaultCurrency?: string | null;
  defaultTimezone?: string | null;
  locale?: string | null;
};

export type RestaurantUpdateRequest = {
  name: string;
  legalName?: string | null;
  taxId?: string | null;
  defaultCurrency?: string | null;
  defaultTimezone?: string | null;
  locale?: string | null;
};

export type RestaurantStatusPatchRequest = {
  status: RestaurantStatus;
};

export type RestaurantListParams = {
  q?: string;
  status?: string;
  page?: number;
  size?: number;
};
