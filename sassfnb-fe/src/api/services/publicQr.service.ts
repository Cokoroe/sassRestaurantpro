import { publicHttp } from "../publicClient";
import type { PublicQrResolveResponse, PublicQrHeartbeatResponse } from "../../types/publicQr";

const DEVICE_FP_KEY = "device_fingerprint";

export function getDeviceFingerprint() {
  const existing = localStorage.getItem(DEVICE_FP_KEY);
  if (existing) return existing;

  const fp = crypto.randomUUID();
  localStorage.setItem(DEVICE_FP_KEY, fp);
  return fp;
}

export const publicQrService = {
  /** QR động: GET /api/v1/public/qr/resolve?token=... */
  resolve: async (token: string) => {
    const fp = getDeviceFingerprint();
    const res = await publicHttp.get<PublicQrResolveResponse>("/public/qr/resolve", {
      params: { token },
      headers: { "X-Device-Fingerprint": fp },
    });
    return res.data;
  },

  /** QR tĩnh: GET /api/v1/public/qr/static/resolve?code=... */
  resolveStatic: async (code: string) => {
    const fp = getDeviceFingerprint();
    const res = await publicHttp.get<PublicQrResolveResponse>("/public/qr/static/resolve", {
      params: { code },
      headers: { "X-Device-Fingerprint": fp },
    });
    return res.data;
  },

  /** Heartbeat: POST /api/v1/public/qr/sessions/{id}/heartbeat */
  heartbeat: async (qrSessionId: string) => {
    const res = await publicHttp.post<PublicQrHeartbeatResponse>(
      `/public/qr/sessions/${qrSessionId}/heartbeat`
    );
    return res.data;
  },
};
