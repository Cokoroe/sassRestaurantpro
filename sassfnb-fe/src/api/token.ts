// src/api/token.ts
export const tokenStorage = {
  getAccess: () => localStorage.getItem("access_token"),
  getRefresh: () => localStorage.getItem("refresh_token"),

  setTokens: (access: string, refresh?: string) => {
    localStorage.setItem("access_token", access);
    if (refresh) localStorage.setItem("refresh_token", refresh);
  },

  clearTokens: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  },
};

export const contextStorage = {
  getRestaurantId: () => localStorage.getItem("restaurant_id"),
  getOutletId: () => localStorage.getItem("outlet_id"),

  setRestaurant: (id: string | null, name?: string | null) => {
    if (id) localStorage.setItem("restaurant_id", id);
    else localStorage.removeItem("restaurant_id");

    if (name) localStorage.setItem("restaurant_name", name);
    else localStorage.removeItem("restaurant_name");
  },

  setOutlet: (id: string | null, name?: string | null) => {
    if (id) localStorage.setItem("outlet_id", id);
    else localStorage.removeItem("outlet_id");

    if (name) localStorage.setItem("outlet_name", name);
    else localStorage.removeItem("outlet_name");
  },

  clearContext: () => {
    localStorage.removeItem("restaurant_id");
    localStorage.removeItem("restaurant_name");
    localStorage.removeItem("outlet_id");
    localStorage.removeItem("outlet_name");
  },
};

export const clearAllAuth = () => {
  tokenStorage.clearTokens();
  contextStorage.clearContext();
};
