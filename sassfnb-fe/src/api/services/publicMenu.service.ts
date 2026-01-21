// src/api/services/publicMenu.service.ts
import { publicHttp } from "../publicClient";
import type { PublicMenuTreeResponse } from "../../types/publicMenu";

export const publicMenuService = {
  // ✅ GET /api/v1/public/menu/tree?orderId=...&outletId=...&at=...
  tree: async (params: { orderId?: string; outletId?: string; at?: string }) => {
    const res = await publicHttp.get<PublicMenuTreeResponse>("/public/menu/tree", {
      params,
    });
    return res.data;
  },
};
