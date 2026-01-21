export function money(n?: string | number | null) {
  const v = Number(n ?? 0);
  if (Number.isNaN(v)) return String(n ?? "0");
  return v.toLocaleString("vi-VN");
}
