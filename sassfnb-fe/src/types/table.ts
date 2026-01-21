// src/types/table.ts

export type TableStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "INACTIVE";

export type TableSessionStatus = "OPEN" | "NONE";

export type Table = {
  id: string;
  code: string;
  name: string | null;
  capacity: number | null;
  groupCode: string | null;
  status: string; // BE trả String, thường là AVAILABLE/OCCUPIED...
  outletId: string;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;

  // Extra (BE map thêm)
  currentQrToken: string | null;
  currentQrExpiresAt: string | null;
  currentSessionStatus: TableSessionStatus | string | null;
};

export type TableListParams = {
  outletId: string;
  q?: string;
  status?: string;
  groupCode?: string;
  page?: number;
  size?: number;
};

export type TableCreatePayload = {
  outletId: string;
  code: string;
  name?: string | null;
  capacity?: number | null;
  groupCode?: string | null;
  status?: string | null; // default AVAILABLE nếu null
};

export type TableUpdatePayload = {
  name?: string | null;
  capacity?: number | null;
  groupCode?: string | null;
  status?: string | null;
};

export type TableStatusPatchPayload = {
  status: string;
};

// QR động
export type DynamicQrDto = {
  token: string | null;
  expiresAt: string | null;
  qrUrl: string | null;
};

export type RotateQrPayload = {
  ttlMinutes?: number | null;
};

// QR tĩnh (TableStaticQrAppService.QrStaticDto)
export type StaticQrDto = {
  code: string | null;
  imageUrl: string | null;
};

export type StaticQrGenerateParams = {
  size?: number;
  force?: boolean;
};

export type StaticQrRefreshParams = {
  size?: number;
};
