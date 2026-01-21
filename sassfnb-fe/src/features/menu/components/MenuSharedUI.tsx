import React from "react";
import { Package } from "lucide-react";

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const StatChip: React.FC<{ status: "ACTIVE" | "INACTIVE" | string }> = ({
  status,
}) => {
  const active = status === "ACTIVE";
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
        active
          ? "bg-emerald-100 text-emerald-700"
          : "bg-slate-100 text-slate-500"
      )}
    >
      <span
        className={cx(
          "w-1.5 h-1.5 rounded-full",
          active ? "bg-emerald-500" : "bg-slate-400"
        )}
      />
      {active ? "Đang bán" : "Ngừng"}
    </span>
  );
};

export const MenuThumb: React.FC<{
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}> = ({ src, name, size = "md", className }) => {
  const sizes: Record<string, string> = {
    sm: "w-10 h-10 rounded-xl text-xs",
    md: "w-14 h-14 rounded-2xl text-sm",
    lg: "w-20 h-20 rounded-[1.5rem] text-xl",
    xl: "w-32 h-32 rounded-[2rem] text-3xl",
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cx(
          sizes[size],
          "object-cover shadow-sm border border-slate-100 shrink-0",
          className
        )}
      />
    );
  }

  const colors = [
    "bg-blue-100 text-blue-600",
    "bg-emerald-100 text-emerald-600",
    "bg-rose-100 text-rose-600",
    "bg-amber-100 text-amber-600",
    "bg-purple-100 text-purple-600",
  ];
  const color = colors[(name?.length ?? 0) % colors.length];

  return (
    <div
      className={cx(
        sizes[size],
        color,
        "flex items-center justify-center font-black shadow-inner shrink-0",
        className
      )}
    >
      {(name?.charAt(0) ?? "?").toUpperCase()}
    </div>
  );
};

export const EmptyState: React.FC<{ title: string; desc: string }> = ({
  title,
  desc,
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-in fade-in zoom-in duration-500">
    <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-[2rem] flex items-center justify-center mb-6">
      <Package size={40} />
    </div>
    <h3 className="text-lg font-black text-slate-800">{title}</h3>
    <p className="text-sm text-slate-500 mt-2 max-w-[280px] leading-relaxed">
      {desc}
    </p>
  </div>
);

export const SkeletonCard: React.FC = () => (
  <div className="p-4 rounded-[1.5rem] border border-slate-100 bg-white">
    <div className="w-16 h-16 rounded-2xl bg-slate-100 animate-pulse mx-auto" />
    <div className="mt-3 space-y-2">
      <div className="h-4 bg-slate-100 rounded w-2/3 mx-auto animate-pulse" />
      <div className="h-3 bg-slate-50 rounded w-1/2 mx-auto animate-pulse" />
    </div>
  </div>
);
