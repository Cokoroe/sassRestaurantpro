// src/types/outlet.ts
export type OutletStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export type Outlet = {
  id: string;
  name: string;
  code?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  timezone?: string | null;

  // BE trả openHoursJson trong response (OutletResponse)
  // FE đang dùng field openHours => ta unify dùng openHours
  openHours?: string | null;

  isDefault?: boolean;
  status?: OutletStatus | string;

  createdAt?: string;
  updatedAt?: string;

  // (Optional) nếu BE trả thêm restaurantId thì bạn thêm vào đây,
  // còn nếu không trả thì thôi.
  restaurantId?: string;
};

export type OutletListParams = {
  restaurantId?: string; // BE hỗ trợ optional
  q?: string;
  city?: string;
  isDefault?: boolean;
  page?: number;
  size?: number;
  sort?: string;
};

export type OutletCreateRequest = {
  restaurantId?: string | null; // BE: nếu null -> lấy từ context
  name: string;
  code?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  timezone?: string | null;
  openHours?: string | null;  // BE: openHours (String JSON)
  isDefault?: boolean | null;
  status?: OutletStatus | string | null; // BE create đang set ACTIVE cứng, FE có cũng ok
};

export type OutletUpdateRequest = {
  name?: string | null;
  code?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  timezone?: string | null;
  openHours?: string | null;
  isDefault?: boolean | null;
  status?: OutletStatus | string | null;
};

export type OutletHoursUpdateRequest = {
  openHours: string; // BE yêu cầu openHours
};
