// src/features/auth/pages/AuthLayout.tsx
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-screen overflow-hidden bg-zinc-950">
      <div className="relative min-h-screen w-screen">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=2070&auto=format&fit=crop"
            alt="Restaurant background"
            className="h-full w-full object-cover opacity-45"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-950/95 via-zinc-950/70 to-amber-950/70" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.22),transparent_42%),radial-gradient(circle_at_80%_30%,rgba(239,68,68,0.18),transparent_38%),radial-gradient(circle_at_55%_92%,rgba(34,197,94,0.12),transparent_45%)]" />
        </div>

        {/* Content - full width, no max container */}
        <div className="relative z-10 flex min-h-screen w-screen items-center px-4 py-6 sm:px-8 lg:px-12">
          <div className="grid w-full items-center gap-10 lg:grid-cols-2 lg:gap-12">
            {/* Left marketing (ẩn trên mobile) */}
            <div className="hidden lg:flex lg:flex-col lg:justify-center">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-[0_10px_35px_rgba(0,0,0,0.35)] backdrop-blur">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-amber-500 to-red-500 shadow-[0_10px_25px_rgba(245,158,11,0.25)]">
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="text-white"
                    >
                      <path
                        d="M3 7h18M6 7v13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-white">
                      SassFnB
                    </div>
                    <div className="text-xs text-white/70">
                      Quản lý nhà hàng • Đa chi nhánh • RBAC
                    </div>
                  </div>
                </div>

                <h1 className="mt-8 text-5xl font-semibold leading-tight tracking-tight text-white">
                  Vận hành nhà hàng gọn gàng hơn,{" "}
                  <span className="bg-gradient-to-r from-amber-400 to-red-400 bg-clip-text text-transparent">
                    tăng hiệu suất mỗi ngày
                  </span>
                  .
                </h1>

                <p className="mt-4 text-base leading-relaxed text-white/75">
                  Đăng nhập để quản lý nhà hàng/chi nhánh, nhân sự, menu, bàn,
                  order, chấm công… Tất cả trong một hệ thống.
                </p>

                <div className="mt-8 grid gap-3 text-sm text-white/70">
                  <div className="flex items-start gap-3">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-amber-400" />
                    <span>
                      Tự động refresh token, giữ phiên ổn định, an toàn
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-red-400" />
                    <span>RBAC/Feature flags: đúng quyền, đúng màn hình</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-emerald-400" />
                    <span>Context nhà hàng/chi nhánh đồng bộ theo sidebar</span>
                  </div>
                </div>

                <div className="mt-10 text-xs text-white/45">
                  © {new Date().getFullYear()} SassFnB. All rights reserved.
                </div>
              </div>
            </div>

            {/* Right form: ONLY form has max width */}
            <div className="flex w-full items-center justify-center lg:justify-end">
              <div className="w-full max-w-[560px]">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
