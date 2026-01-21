// src/features/auth/components/PasswordInput.tsx
import { useState, type InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  error?: string | null;
  hint?: string;
};

function EyeIcon({ off }: { off?: boolean }) {
  return off ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 3l18 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10.58 10.58a2 2 0 0 0 2.83 2.83"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9.88 5.08A10.94 10.94 0 0 1 12 5c7 0 10 7 10 7a18.1 18.1 0 0 1-3.06 4.2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6.23 6.23A18.5 18.5 0 0 0 2 12s3 7 10 7a10.9 10.9 0 0 0 4.12-.82"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function PasswordInput({ label, error, hint, ...props }: Props) {
  const [show, setShow] = useState(false);

  return (
    <label className="block">
      <div className="mb-1.5 text-sm font-medium text-white/85">{label}</div>
      <div
        className={`group flex items-center gap-2 rounded-xl border px-3 py-2.5 shadow-sm backdrop-blur transition-all ${
          error
            ? "border-red-400/40 focus-within:border-red-400/70"
            : "border-white/10 focus-within:border-amber-400/50"
        } bg-transparent`}
      >
        <div className="text-white/60 group-focus-within:text-amber-300">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M16 10V8a4 4 0 0 0-8 0v2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M7 10h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <input
          {...props}
          type={show ? "text" : "password"}
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="grid h-9 w-9 place-items-center rounded-lg text-white/70 hover:text-white focus:text-amber-300 focus:outline-none transition"
          aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        >
          <EyeIcon off={show} />
        </button>
      </div>
      {error ? (
        <div className="mt-1 text-xs text-red-200/90">{error}</div>
      ) : hint ? (
        <div className="mt-1 text-xs text-white/55">{hint}</div>
      ) : null}
    </label>
  );
}
