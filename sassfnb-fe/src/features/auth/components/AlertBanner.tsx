// src/features/auth/components/AlertBanner.tsx
type Props = {
  type?: "success" | "error" | "info" | "warning";
  title?: string;
  message: string;
  onClose?: () => void;
};

const styles: Record<NonNullable<Props["type"]>, string> = {
  success: "border-emerald-400/30 bg-emerald-500/10 text-emerald-50",
  error: "border-red-400/30 bg-red-500/10 text-red-50",
  info: "border-sky-400/30 bg-sky-500/10 text-sky-50",
  warning: "border-amber-400/30 bg-amber-500/10 text-amber-50",
};

export default function AlertBanner({
  type = "info",
  title,
  message,
  onClose,
}: Props) {
  return (
    <div className={`relative rounded-xl border px-4 py-3 ${styles[type]}`}>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-2 top-2 rounded-lg p-1 text-white/70 hover:bg-white/10 hover:text-white"
          aria-label="Close alert"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}

      {title && <div className="mb-0.5 text-sm font-semibold">{title}</div>}
      <div className="text-sm leading-relaxed text-white/85">{message}</div>
    </div>
  );
}
