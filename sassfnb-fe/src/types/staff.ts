// src/types/staff.ts
export type UUID = string;

export type StaffStatus = "ACTIVE" | "INACTIVE";

export type Staff = {
  id: UUID;
  tenantId: UUID;
  userId: UUID;
  restaurantId: UUID;
  outletId?: UUID | null;

  code?: string | null;
  position?: string | null;
  avatarUrl?: string | null;
  status: StaffStatus;

  email?: string | null;
  fullName?: string | null;
  phone?: string | null;

  hiredDate: string; // yyyy-MM-dd
  terminatedDate?: string | null;

  createdAt?: string;
  updatedAt?: string;
};

export type StaffListParams = {
  restaurantId?: UUID;
  outletId?: UUID;
  q?: string;
  status?: StaffStatus | string;
  page?: number;
  size?: number;
};

export type StaffCreateRequest = {
  restaurantId: UUID;
  outletId: UUID;

  email: string;
  fullName?: string;
  phone?: string;

  code?: string;
  position?: string;
  avatarUrl?: string;

  hiredDate?: string; // yyyy-MM-dd

  roleId: UUID; // REQUIRED by BE
};

export type StaffUpdateRequest = {
  restaurantId?: UUID;
  outletId?: UUID;

  code?: string;
  position?: string;
  avatarUrl?: string;

  hiredDate?: string;
  terminatedDate?: string;

  fullName?: string;
  phone?: string;
};

export type StaffStatusUpdateRequest = {
  status: StaffStatus;
  note?: string;
};

export type StaffOption = {
  name: string;
  id: UUID;
  label: string;
  status: StaffStatus;
  position?: string | null;
  avatarUrl?: string | null;
};

// alias dùng trong UI
export type StaffCreatePayload = StaffCreateRequest;
export type StaffUpdatePayload = StaffUpdateRequest;
