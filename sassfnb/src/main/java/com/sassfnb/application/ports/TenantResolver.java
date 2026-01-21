package com.sassfnb.application.ports;

import java.util.UUID;

/**
 * Resolve các context ID hiện tại từ:
 * - SecurityContext (JWT -> UserPrincipal)
 * - HTTP headers (X-User-Id, X-Tenant-Id, X-Restaurant-Id, X-Outlet-Id)
 */
public interface TenantResolver {

    // Ưu tiên từ header X-Outlet-Id, nếu không có thì có thể null/exception tùy
    // use-case
    UUID currentOutletId();

    // Suy từ outlet (X-Outlet-Id) hoặc header X-Restaurant-Id, hoặc tenant ->
    // restaurant
    UUID currentRestaurantId();

    // Suy từ JWT (UserPrincipal) là chính; fallback header X-Tenant-Id
    UUID currentTenantId();

    // Từ SecurityContext (UserPrincipal); fallback header X-User-Id
    UUID currentUserId();
}
