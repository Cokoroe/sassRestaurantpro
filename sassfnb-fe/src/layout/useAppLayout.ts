// src/layout/useAppLayout.ts
import { useOutletContext } from "react-router-dom";
import type { AppLayoutContext } from "./AppLayout";

export const useAppLayout = () => useOutletContext<AppLayoutContext>();
