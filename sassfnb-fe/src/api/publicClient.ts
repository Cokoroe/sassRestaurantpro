// src/api/publicClient.ts
import axios from "axios";

/**
 * Public API client:
 * - Dùng cho luồng khách quét QR (không cần JWT)
 * - Base URL phải trỏ về BE: http://localhost:8080/api/v1
 *
 * Nếu bạn có env:
 * - VITE_PUBLIC_API_BASE="http://localhost:8080/api/v1"
 * hoặc
 * - VITE_API_BASE="http://localhost:8080/api/v1"
 */
const baseURL =
  (import.meta as any).env?.VITE_PUBLIC_API_BASE ||
  (import.meta as any).env?.VITE_API_BASE ||
  "http://localhost:8080/api/v1";

export const publicHttp = axios.create({
  baseURL,
  timeout: 20_000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: debug log khi dev để bắt lỗi baseURL undefined
publicHttp.interceptors.request.use((config) => {
  // Nếu vẫn bị undefined, bạn sẽ nhìn thấy ngay ở console
  // console.log("[publicHttp]", config.method?.toUpperCase(), config.baseURL + config.url);
  return config;
});
