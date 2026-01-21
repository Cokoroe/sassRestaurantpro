// src/types/auth.ts
export type Tokens = {
  accessToken: string;
  refreshToken?: string;
  expiresInSeconds?: number;
};

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  status: string;
  createdAt: string;

  tenantId: string | null;
  tenantCode: string | null;
  tenantName: string | null;

  staffId: string | null;

  restaurantId: string | null;
  restaurantName: string | null;

  outletId: string | null;
  outletName: string | null;

  roles: string[];
};

export type RegisterOwnerPayload = {
  email: string;
  password: string;
  fullName: string;
  restaurantName: string;
};

export type LoginRequest = {
  username: string;
  password: string;
};
