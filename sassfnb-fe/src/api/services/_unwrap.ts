// src/api/services/_unwrap.ts
export const unwrap = <T>(res: any): T => {
  if (res && typeof res === "object" && "data" in res) return res.data as T;
  return res as T;
};
