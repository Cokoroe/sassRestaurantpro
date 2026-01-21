// src/api/axios.ts
import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import type { Tokens } from "../types/auth";
import { clearAllAuth, contextStorage, tokenStorage } from "./token";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

const AUTH_PATHS_NO_REFRESH = [
  "/auth/login",
  "/auth/refresh",
  "/auth/logout",
  "/auth/register-owner",
  "/auth/me",
  "/auth/password/forgot",
  "/auth/password/reset",
  "/auth/email/verify",
  "/auth/email/send-verify",
];

const shouldSkipRefresh = (config?: AxiosRequestConfig) => {
  const url = (config?.url ?? "").toString();
  return AUTH_PATHS_NO_REFRESH.some((p) => url.includes(p));
};

// ===== Request: attach token + context headers =====
api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess();
  const restaurantId = contextStorage.getRestaurantId();
  const outletId = contextStorage.getOutletId();

  config.headers = config.headers ?? {};

  if (token) (config.headers as any).Authorization = `Bearer ${token}`;
  if (restaurantId) (config.headers as any)["X-Restaurant-Id"] = restaurantId;
  if (outletId) (config.headers as any)["X-Outlet-Id"] = outletId;

  return config;
});

// ===== Refresh lock (single-flight) =====
let refreshingPromise: Promise<string> | null = null;

const doRefreshToken = async (): Promise<string> => {
  const rt = tokenStorage.getRefresh();
  if (!rt) throw new Error("No refresh token");

  const { data } = await axios.post<Tokens>(`${API_BASE_URL}/auth/refresh`, {
    refreshToken: rt,
  });

  if (!data?.accessToken) throw new Error("Invalid refresh response");

  tokenStorage.setTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
};

// ===== Response: auto refresh on 401 =====
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const response = error.response;
    const originalConfig = error.config as
      | (AxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (!response || !originalConfig) return Promise.reject(error);

    // 403 => thiếu quyền, không auto logout
    if (response.status === 403) return Promise.reject(error);

    // chỉ xử lý 401
    if (response.status !== 401) return Promise.reject(error);

    // auth endpoints => không refresh
    if (shouldSkipRefresh(originalConfig)) return Promise.reject(error);

    // avoid loop
    if (originalConfig._retry) return Promise.reject(error);
    originalConfig._retry = true;

    try {
      refreshingPromise ??= doRefreshToken().finally(() => {
        refreshingPromise = null;
      });

      const newAccess = await refreshingPromise;

      originalConfig.headers = originalConfig.headers ?? {};
      (originalConfig.headers as any).Authorization = `Bearer ${newAccess}`;

      return api(originalConfig);
    } catch (e) {
      console.error("Refresh token failed", e);
      clearAllAuth();
      window.location.replace("/auth/login");
      return Promise.reject(error);
    }
  }
);
