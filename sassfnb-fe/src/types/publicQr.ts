export type PublicTableInfo = {
  tableId: string;
  code: string;
  name: string;
  capacity: number | null;
  groupCode: string | null;
  status: string;
};

export type PublicQrResolveResponse = {
  tenantId: string;
  outletId: string;
  tableId: string;
  tableInfo: PublicTableInfo;
  qrSessionId: string;
  sessionExpiresAt: string; // Instant ISO
};

export type PublicQrHeartbeatResponse = {
  qrSessionId: string;
  lastSeenAt: string;
  status: string;
};
