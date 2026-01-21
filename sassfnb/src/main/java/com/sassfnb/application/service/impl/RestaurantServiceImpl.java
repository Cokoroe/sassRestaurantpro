package com.sassfnb.application.service.impl;

import com.sassfnb.adapters.rest.dto.tenant.RestaurantDtos.RestaurantCreateRequest;
import com.sassfnb.adapters.rest.dto.tenant.RestaurantDtos.RestaurantResponse;
import com.sassfnb.adapters.rest.dto.tenant.RestaurantDtos.RestaurantStatusPatchRequest;
import com.sassfnb.adapters.rest.dto.tenant.RestaurantDtos.RestaurantUpdateRequest;
import com.sassfnb.application.ports.TenantResolver;
import com.sassfnb.adapters.persistence.entity.RestaurantEntity;
import com.sassfnb.adapters.persistence.repository.RestaurantRepository;
import com.sassfnb.application.service.RestaurantService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RestaurantServiceImpl implements RestaurantService {

    private final RestaurantRepository repo;
    private final TenantResolver tenant;

    private RestaurantResponse map(RestaurantEntity e) {
        return new RestaurantResponse(
                e.getId(),
                e.getName(),
                e.getLegalName(),
                e.getTaxId(),
                e.getDefaultCurrency(),
                e.getDefaultTimezone(),
                e.getLocale(),
                e.getStatus(),
                e.getCreatedAt(),
                e.getUpdatedAt());
    }

    @Override
    public RestaurantResponse getMyRestaurant() {
        UUID ownerId = tenant.currentUserId();
        UUID tenantId = tenant.currentTenantId();

        RestaurantEntity e = repo
                .findFirstByTenantIdAndOwnerUserIdOrderByCreatedAtAsc(tenantId, ownerId)
                .orElseThrow(() -> new IllegalStateException("Owner chưa có nhà hàng nào"));

        return map(e);
    }

    @Override
    @Transactional
    public RestaurantResponse updateMyRestaurant(RestaurantUpdateRequest req) {
        UUID ownerId = tenant.currentUserId();
        UUID tenantId = tenant.currentTenantId();

        RestaurantEntity e = repo
                .findFirstByTenantIdAndOwnerUserIdOrderByCreatedAtAsc(tenantId, ownerId)
                .orElseThrow(() -> new IllegalStateException("Owner chưa có nhà hàng nào"));

        e.setName(req.name());
        e.setLegalName(req.legalName());
        e.setTaxId(req.taxId());
        e.setDefaultCurrency(req.defaultCurrency());
        e.setDefaultTimezone(req.defaultTimezone());
        e.setLocale(req.locale());
        e.setUpdatedAt(Instant.now());
        return map(e);
    }

    @Override
    public Page<RestaurantResponse> listOwnedRestaurants(String q, String status, Pageable pageable) {
        UUID ownerId = tenant.currentUserId();
        if (q == null)
            q = "";
        if (status == null || status.isBlank())
            status = "";
        return repo
                .findByOwnerUserIdAndStatusContainingIgnoreCaseAndNameContainingIgnoreCase(
                        ownerId, status, q, pageable)
                .map(this::map);
    }

    @Override
    @Transactional
    public RestaurantResponse createRestaurant(RestaurantCreateRequest req) {
        UUID ownerId = tenant.currentUserId();
        UUID tenantId = tenant.currentTenantId();

        RestaurantEntity e = RestaurantEntity.builder()
                .tenantId(tenantId)
                .ownerUserId(ownerId)
                .name(req.name())
                .legalName(req.legalName())
                .taxId(req.taxId())
                .defaultCurrency(req.defaultCurrency())
                .defaultTimezone(req.defaultTimezone())
                .locale(req.locale())
                .status("ACTIVE")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        repo.save(e);
        return map(e);
    }

    @Override
    public RestaurantResponse getRestaurant(UUID id) {
        return repo.findById(id).map(this::map).orElseThrow();
    }

    @Override
    @Transactional
    public void patchRestaurantStatus(UUID id, RestaurantStatusPatchRequest req) {
        RestaurantEntity e = repo.findById(id).orElseThrow();
        e.setStatus(req.status());
        e.setUpdatedAt(Instant.now());
    }

    @Override
    @Transactional
    public RestaurantResponse updateRestaurant(UUID id, RestaurantUpdateRequest req) {
        UUID tenantId = tenant.currentTenantId();
        UUID userId = tenant.currentUserId();

        RestaurantEntity e = repo.findById(id).orElseThrow();

        // ✅ Security/ownership check để không update bừa
        // Nếu bạn muốn ROOT/ADMIN sửa được tất cả trong tenant thì có thể nới check
        // theo role,
        // nhưng ở đây mình giữ an toàn theo tenant + owner.
        if (!tenantId.equals(e.getTenantId())) {
            throw new IllegalStateException("Restaurant không thuộc tenant hiện tại");
        }

        // Nếu muốn chỉ OWNER của nhà hàng mới sửa được:
        // (ROOT/ADMIN vẫn qua được nếu bạn thêm check role ở TenantResolver)
        if (!userId.equals(e.getOwnerUserId())) {
            throw new IllegalStateException("Bạn không có quyền sửa nhà hàng này");
        }

        e.setName(req.name());
        e.setLegalName(req.legalName());
        e.setTaxId(req.taxId());
        e.setDefaultCurrency(req.defaultCurrency());
        e.setDefaultTimezone(req.defaultTimezone());
        e.setLocale(req.locale());
        e.setUpdatedAt(Instant.now());

        return map(e);
    }

}
