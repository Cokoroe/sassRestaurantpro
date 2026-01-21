// src/features/auth/components/AuthCard.tsx
import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export default function AuthCard({ title, subtitle, children }: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur">
      {/* Mobile brand */}
      <div className="mb-5 flex items-center gap-3 lg:hidden">
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
          <div className="text-base font-semibold text-white">SassFnB</div>
          <div className="text-xs text-white/60">Hệ thống quản lý nhà hàng</div>
        </div>
      </div>

      <div className="mb-5">
        <div className="text-2xl font-semibold text-white">{title}</div>
        {subtitle ? (
          <div className="mt-1 text-sm leading-relaxed text-white/65">
            {subtitle}
          </div>
        ) : null}
      </div>

      {children}
    </div>
  );
}
