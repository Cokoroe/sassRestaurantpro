// src/main/java/com/sassfnb/application/service/impl/MenuPriceServiceImpl.java
package com.sassfnb.application.service.impl;

import com.sassfnb.adapters.persistence.entity.MenuItemPriceEntity;
import com.sassfnb.adapters.persistence.repository.MenuItemPriceRepository;
import com.sassfnb.adapters.rest.dto.menu.MenuDtos.*;
import com.sassfnb.application.ports.TenantResolver;
import com.sassfnb.application.service.MenuPriceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class MenuPriceServiceImpl implements MenuPriceService {

    private final MenuItemPriceRepository repo;
    private final TenantResolver tenantResolver;

    private UUID tenantId() {
        return tenantResolver.currentTenantId();
    }

    // ================================
    // LIST PRICE
    // ================================
    @Override
    @Transactional(readOnly = true)
    public List<PriceResponse> listPrices(UUID itemId, UUID outletId) {
        // outletId không dùng nữa → bỏ
        var list = repo.findByMenuItemIdOrderByCreatedAtDesc(itemId);
        return list.stream().map(this::toDto).toList();
    }

    // ================================
    // CREATE PRICE
    // ================================
    @Override
    public PriceResponse createPrice(UUID itemId, PriceCreateRequest req) {
        var e = new MenuItemPriceEntity();

        e.setMenuItemId(itemId);
        e.setTenantId(tenantId()); // nếu bạn có context tenant thì set

        e.setVariantName(req.currency()); // tạm dùng làm variantName hoặc sửa DTO nếu cần
        e.setPrice(req.basePrice()); // DB chỉ có price → dùng basePrice

        e.setValidFrom(req.startAt());
        e.setValidTo(req.endAt());

        return toDto(repo.save(e));
    }

    // ================================
    // UPDATE PRICE
    // ================================
    @Override
    public PriceResponse updatePrice(UUID itemId, UUID priceId, PriceUpdateRequest req) {
        var e = find(priceId);

        if (!e.getMenuItemId().equals(itemId))
            throw new IllegalArgumentException("Invalid item");

        if (req.basePrice() != null)
            e.setPrice(req.basePrice());
        if (req.startAt() != null)
            e.setValidFrom(req.startAt());
        if (req.endAt() != null)
            e.setValidTo(req.endAt());
        if (req.currency() != null)
            e.setVariantName(req.currency());

        return toDto(repo.save(e));
    }

    // ================================
    // ACTIVATE (KHÔNG CẦN NỮA)
    // ================================
    @Override
    public PriceResponse activatePrice(UUID itemId, UUID priceId, PriceActivatePatchRequest req) {
        throw new UnsupportedOperationException("Model no longer supports activating/deactivating price");
    }

    // ================================
    // DELETE
    // ================================
    @Override
    public void deletePrice(UUID itemId, UUID priceId) {
        var e = find(priceId);
        if (!e.getMenuItemId().equals(itemId))
            throw new IllegalArgumentException("Invalid item");
        repo.delete(e);
    }

    // ================================
    // GET EFFECTIVE PRICE
    // ================================
    @Override
    @Transactional(readOnly = true)
    public PriceResponse getEffectivePrice(UUID itemId, UUID outletId, Instant at) {

        Instant effectiveAt = (at != null) ? at : Instant.now();

        var p = repo.findEffectivePriceAt(itemId, effectiveAt)
                .orElseGet(() -> repo.findTopByMenuItemIdOrderByCreatedAtDesc(itemId).orElse(null));

        return p == null ? null : toDto(p);
    }

    // ================================
    // Helper
    // ================================
    private MenuItemPriceEntity find(UUID id) {
        return repo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Price not found"));
    }

    private PriceResponse toDto(MenuItemPriceEntity p) {
        return new PriceResponse(
                p.getId(),
                p.getMenuItemId(),
                null, // outletId no longer exists
                p.getVariantName(), // currency replaced
                p.getPrice(),
                null, // takeawayPrice removed
                p.getValidFrom(),
                p.getValidTo(),
                true, // isActive removed → default always true
                p.getCreatedAt(),
                p.getUpdatedAt());
    }
}
