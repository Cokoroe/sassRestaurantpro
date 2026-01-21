// src/features/auth/hooks/useAuthForm.ts
import { useState } from "react";

export function useAuthForm<T extends Record<string, any>>(initial: T) {
  const [values, setValues] = useState<T>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const setField = (name: keyof T, value: any) => {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => {
      if (!e[name as string]) return e;
      const next = { ...e };
      delete next[name as string];
      return next;
    });
  };

  return { values, setValues, errors, setErrors, loading, setLoading, setField };
}
