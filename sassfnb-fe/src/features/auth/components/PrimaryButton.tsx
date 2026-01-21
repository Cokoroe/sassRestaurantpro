import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
};

export default function PrimaryButton({
  loading,
  className = "",
  children,
  ...props
}: Props) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={[
        "w-full rounded-xl px-5 py-3.5 font-extrabold text-white",
        "bg-gradient-to-r from-rose-700 to-amber-600",
        "hover:from-rose-800 hover:to-amber-700",
        "shadow-lg shadow-rose-700/15 hover:shadow-xl hover:shadow-rose-700/20",
        "active:scale-[0.99] transition-all duration-200",
        "disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100",
        "flex items-center justify-center gap-2",
        className,
      ].join(" ")}
    >
      {loading ? (
        <>
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          <span>Đang xử lý…</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
