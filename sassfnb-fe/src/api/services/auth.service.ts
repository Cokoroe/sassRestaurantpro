// src/api/services/auth.service.ts
import { http } from "../client";
import type { Tokens, AuthUser, RegisterOwnerPayload, LoginRequest } from "../../types/auth";

export const authService = {
  registerOwner: (payload: RegisterOwnerPayload) =>
    http.post<Tokens>("/auth/register-owner", payload),

  login: (payload: LoginRequest) => http.post<Tokens>("/auth/login", payload),

  refresh: (refreshToken: string) =>
    http.post<Tokens>("/auth/refresh", { refreshToken }),

  logout: (refreshToken: string, allDevices = false) =>
    http.post<void>("/auth/logout", { refreshToken, allDevices }),

  me: () => http.get<AuthUser>("/auth/me"),

  sendVerifyEmail: () => http.post<{ message: string }>("/auth/email/send-verify"),

  verifyEmail: (token: string) => http.post<{ message: string }>("/auth/email/verify", { token }),

  forgotPassword: (email: string) => http.post<{ message: string }>("/auth/password/forgot", { email }),

  resetPassword: (token: string, newPassword: string) =>
    http.post<{ message: string }>("/auth/password/reset", { token, newPassword }),
};
