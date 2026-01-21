// src/app/providers/AppProviders.tsx
import type { ReactNode } from "react";
import { RbacProvider } from "./RbacProvider";

export default function AppProviders({ children }: { children: ReactNode }) {
  return <RbacProvider>{children}</RbacProvider>;
}
