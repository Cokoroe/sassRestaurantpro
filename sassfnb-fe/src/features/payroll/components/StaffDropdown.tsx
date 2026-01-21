import React, { useMemo } from "react";

export type StaffLike = {
  id: string;
  name?: string | null;
  code?: string | null;
  email?: string | null;

  // allow unknown fields from BE/FE mapping (fullName, label...)
  [key: string]: any;
};

function pickFirstString(obj: any, keys: string[]) {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

export default function StaffDropdown({
  label,
  value,
  onChange,
  options,
  disabled,
  placeholder = "Chọn staff",
  allowAll,
  allLabel = "Tất cả",
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: StaffLike[];
  disabled?: boolean;
  placeholder?: string;
  allowAll?: boolean;
  allLabel?: string;
  className?: string;
}) {
  const normalized = useMemo(() => {
    const KEY_CANDIDATES = [
      "name",
      "fullName",
      "staffName",
      "userFullName",
      "label",
      "displayName",
    ];

    return (options ?? []).map((s) => {
      const name = pickFirstString(s, KEY_CANDIDATES) || (s.name?.trim() ?? "");
      const code = (s.code ?? "").toString().trim();
      const email = (s.email ?? "").toString().trim();

      // Hiển thị thân thiện:
      // - Nếu có name => "name (A001)" hoặc "name - email"
      // - Nếu không có name => ưu tiên code/email rồi mới tới id
      let display = "";
      if (name) {
        if (code) display = `${name} (${code})`;
        else if (email) display = `${name} - ${email}`;
        else display = name;
      } else if (code) {
        display = code;
      } else if (email) {
        display = email;
      } else {
        display = s.id;
      }

      return { ...s, _display: display };
    });
  }, [options]);

  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-slate-600 mb-1">
        {label}
      </label>

      <select
        className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-slate-50"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {allowAll ? (
          <option value="">{allLabel}</option>
        ) : (
          <option value="">{placeholder}</option>
        )}

        {normalized.map((s) => (
          <option key={s.id} value={s.id}>
            {s._display}
          </option>
        ))}
      </select>
    </div>
  );
}
