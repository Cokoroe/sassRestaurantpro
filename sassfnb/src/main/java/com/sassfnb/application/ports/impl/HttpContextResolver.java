package com.sassfnb.application.ports.impl;

import com.sassfnb.adapters.persistence.entity.OutletEntity;
import com.sassfnb.adapters.persistence.entity.RestaurantEntity;
import com.sassfnb.adapters.persistence.repository.OutletRepository;
import com.sassfnb.adapters.persistence.repository.RestaurantRepository;
import com.sassfnb.application.ports.TenantResolver;
import com.sassfnb.config.jwt.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class HttpContextResolver implements TenantResolver {

    private static final String HDR_USER_ID = "X-User-Id";
    private static final String HDR_TENANT_ID = "X-Tenant-Id";
    private static final String HDR_RESTAURANT_ID = "X-Restaurant-Id";
    private static final String HDR_OUTLET_ID = "X-Outlet-Id";

    private final RestaurantRepository restaurantRepository;
    private final OutletRepository outletRepository;

    // ===== Helpers =====

    private HttpServletRequest currentRequest() {
        var attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attrs != null ? attrs.getRequest() : null;
    }

    private UUID parseUuidHeader(String headerName) {
        HttpServletRequest request = currentRequest();
        if (request == null)
            return null;

        String value = request.getHeader(headerName);
        if (value == null || value.isBlank())
            return null;

        try {
            return UUID.fromString(value.trim());
        } catch (IllegalArgumentException ex) {
            // Log nếu cần
            return null;
        }
    }

    private UserPrincipal getPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            return principal;
        }
        return null;
    }

    // ===== Implement TenantResolver =====

    @Override
    public UUID currentUserId() {
        // 1. Ưu tiên từ JWT (SecurityContext)
        UserPrincipal principal = getPrincipal();
        if (principal != null && principal.getUserId() != null) {
            return principal.getUserId();
        }

        // 2. Fallback từ header X-User-Id (ví dụ cho internal call)
        UUID fromHeader = parseUuidHeader(HDR_USER_ID);
        if (fromHeader != null)
            return fromHeader;

        throw new IllegalStateException("Cannot resolve current user id");
    }

    @Override
    public UUID currentTenantId() {
        // 1. Ưu tiên từ JWT
        UserPrincipal principal = getPrincipal();
        if (principal != null && principal.getTenantId() != null) {
            return principal.getTenantId();
        }

        // 2. Fallback từ header X-Tenant-Id
        UUID fromHeader = parseUuidHeader(HDR_TENANT_ID);
        if (fromHeader != null)
            return fromHeader;

        throw new IllegalStateException("Cannot resolve current tenant id");
    }

    @Override
    public UUID currentOutletId() {
        // Hiện tại design: lấy trực tiếp từ header X-Outlet-Id
        UUID outletId = parseUuidHeader(HDR_OUTLET_ID);
        if (outletId != null)
            return outletId;

        // Nếu sau này muốn suy outlet từ restaurant/user thì xử lý thêm ở đây.
        throw new IllegalStateException("Cannot resolve current outlet id (missing X-Outlet-Id header)");
    }

    @Override
    public UUID currentRestaurantId() {
        // 1. Ưu tiên header X-Restaurant-Id (nếu FE/BE truyền thẳng id nhà hàng)
        UUID restaurantId = parseUuidHeader(HDR_RESTAURANT_ID);
        if (restaurantId != null) {
            return restaurantId;
        }

        // 2. Nếu có X-Outlet-Id thì suy nhà hàng từ outlet
        UUID outletId = parseUuidHeader(HDR_OUTLET_ID);
        if (outletId != null) {
            OutletEntity outlet = outletRepository.findById(outletId)
                    .orElseThrow(() -> new IllegalStateException("Outlet not found for id: " + outletId));
            return outlet.getRestaurantId();
        }

        // 3. Cuối cùng: suy từ tenant hiện tại (1 tenant – 1 restaurant)
        UUID tenantId = currentTenantId(); // đã có logic fallback ở trên
        Optional<RestaurantEntity> restaurantOpt = restaurantRepository.findByTenantId(tenantId);

        RestaurantEntity restaurant = restaurantOpt
                .orElseThrow(() -> new IllegalStateException("Restaurant not found for tenant id: " + tenantId));

        return restaurant.getId();
    }
}
