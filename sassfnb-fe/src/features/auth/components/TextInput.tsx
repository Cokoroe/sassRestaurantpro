// src/features/auth/components/TextInput.tsx
import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string | null;
  hint?: string;
  leftIcon?: React.ReactNode;
};

export default function TextInput({
  label,
  error,
  hint,
  leftIcon,
  className,
  ...props
}: Props) {
  return (
    <label className="block">
      <div className="mb-1.5 text-sm font-medium text-white/85">{label}</div>

      <div
        className={[
          "group flex items-center gap-2 rounded-xl border px-3 py-2.5 shadow-sm backdrop-blur",
          error
            ? "border-red-400/40 focus-within:border-red-400/70"
            : "border-white/10 focus-within:border-amber-400/50",
        ].join(" ")}
      >
        {leftIcon ? (
          <div className="text-white/60 group-focus-within:text-amber-300">
            {leftIcon}
          </div>
        ) : null}

        <input
          {...props}
          className={[
            "w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35",
            className ?? "",
          ].join(" ")}
        />
      </div>

      {error ? (
        <div className="mt-1 text-xs text-red-200/90">{error}</div>
      ) : hint ? (
        <div className="mt-1 text-xs text-white/55">{hint}</div>
      ) : null}
    </label>
  );
}
