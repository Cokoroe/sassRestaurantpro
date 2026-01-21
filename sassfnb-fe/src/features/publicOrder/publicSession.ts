// src/features/publicOrder/publicSession.ts
import type { PublicQrResolveResponse } from "../../types/publicQr";

const KEY = "public_qr_context";

export type PublicQrContext = {
  tenantId: string;
  outletId: string;
  tableId: string;
  qrSessionId: string;
  sessionExpiresAt: string;
  tableInfo?: any;
};

export const publicSession = {
  saveFromResolve: (r: PublicQrResolveResponse) => {
    const ctx: PublicQrContext = {
      tenantId: r.tenantId,
      outletId: r.outletId,
      tableId: r.tableId,
      qrSessionId: r.qrSessionId,
      sessionExpiresAt: r.sessionExpiresAt,
      tableInfo: r.tableInfo,
    };
    localStorage.setItem(KEY, JSON.stringify(ctx));
    return ctx;
  },

  get: (): PublicQrContext | null => {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  clear: () => localStorage.removeItem(KEY),
};
