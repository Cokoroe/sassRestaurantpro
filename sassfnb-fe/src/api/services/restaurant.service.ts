// src/api/services/restaurant.service.ts
import { http } from "../client";
import type { PageResponse } from "../../types/page";
import type {
  Restaurant,
  RestaurantCreateRequest,
  RestaurantListParams,
  RestaurantStatusPatchRequest,
  RestaurantUpdateRequest,
} from "../../types/restaurant";

export const restaurantService = {
  // GET /restaurants/me
  me: () => http.get<Restaurant>("/restaurants/me"),

  // PUT /restaurants/me
  updateMe: (payload: RestaurantUpdateRequest) =>
    http.put<Restaurant>("/restaurants/me", payload),

  // GET /restaurants?q=&status=&page=&size=
  listOwnedRestaurants: (params?: RestaurantListParams) =>
    http.get<PageResponse<Restaurant>>("/restaurants", { params }),

  // POST /restaurants
  create: (payload: RestaurantCreateRequest) =>
    http.post<Restaurant>("/restaurants", payload),

  // GET /restaurants/{id}
  getById: (id: string) => http.get<Restaurant>(`/restaurants/${id}`),

  // ✅ ADD: PUT /restaurants/{id}  (để hook/page update chạy đúng, không dùng any)
  update: (id: string, payload: RestaurantUpdateRequest) =>
    http.put<Restaurant>(`/restaurants/${id}`, payload),

  // PATCH /restaurants/{id}/status
  patchStatus: (id: string, payload: RestaurantStatusPatchRequest) =>
    http.patch<void>(`/restaurants/${id}/status`, payload),

  // DELETE /restaurants/{id}
  delete: (id: string) => http.del<void>(`/restaurants/${id}`),
};
