// src/main/java/com/sassfnb/application/service/impl/MenuItemServiceImpl.java
package com.sassfnb.application.service.impl;

import com.sassfnb.adapters.persistence.entity.MenuItemEntity;
import com.sassfnb.adapters.persistence.entity.MenuItemPriceEntity;
import com.sassfnb.adapters.persistence.entity.MenuOptionValueEntity;
import com.sassfnb.adapters.persistence.repository.MenuItemPriceRepository;
import com.sassfnb.adapters.persistence.repository.MenuItemRepository;
import com.sassfnb.adapters.persistence.repository.MenuOptionRepository;
import com.sassfnb.adapters.persistence.repository.MenuOptionValueRepository;
import com.sassfnb.adapters.rest.dto.menu.MenuDtos.*;
import com.sassfnb.application.ports.TenantResolver;
import com.sassfnb.application.ports.UploadGateway;
import com.sassfnb.application.service.MenuItemService;
import com.sassfnb.application.service.MenuPriceService;
import com.sassfnb.config.DevDefaultsProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class MenuItemServiceImpl implements MenuItemService {

    private final MenuItemRepository itemRepo;
    private final MenuOptionRepository optRepo;
    private final MenuOptionValueRepository valRepo;
    private final MenuPriceService priceService;
    private final TenantResolver ctx;
    private final DevDefaultsProperties dev;
    private final MenuItemPriceRepository priceRepo;

    // ✅ NEW
    private final UploadGateway upload;

    private ServiceDefaults defs() {
        return new ServiceDefaults(ctx, dev);
    }

    // =========================================================
    // LIST
    // =========================================================
    @Override
    @Transactional(readOnly = true)
    public Page<ItemResponse> list(ItemListRequest req, Pageable pageable) {
        UUID outletId = (req.outletId() != null) ? req.outletId() : defs().outletId();

        String q = (req.q() != null && req.q().isBlank()) ? null : req.q();
        String status = (req.status() != null && req.status().isBlank()) ? null : req.status();

        var page = itemRepo.search(outletId, q, req.categoryId(), status, pageable);
        return page.map(this::toDto);
    }

    // =========================================================
    // CREATE
    // =========================================================
    @Override
    public ItemResponse create(ItemCreateRequest req) {
        UUID outletId = (req.outletId() != null) ? req.outletId() : defs().outletId();

        if (req.code() != null && itemRepo.existsByOutletIdAndCode(outletId, req.code())) {
            throw new IllegalArgumentException("Item code already exists");
        }

        BigDecimal price = (req.basePrice() != null) ? req.basePrice() : BigDecimal.ZERO;

        var e = new MenuItemEntity();
        e.setTenantId(defs().tenantId());
        e.setOutletId(outletId);
        e.setCategoryId(req.categoryId());
        e.setName(req.name());

        String code = (req.code() == null || req.code().isBlank())
                ? ("ITEM-" + UUID.randomUUID().toString().substring(0, 8))
                : req.code();
        e.setCode(code);

        e.setDescription(req.description());
        e.setImageUrl(req.imageUrl()); // vẫn cho phép create bằng url (nếu FE đã có url)
        e.setThumbnailUrl(null);

        e.setBasePrice(price);

        String status = (req.status() == null) ? "ACTIVE" : req.status();
        e.setAvailable("ACTIVE".equalsIgnoreCase(status));

        // 1) Save item trước để có itemId
        e = itemRepo.save(e);

        // 2) Auto create 1 price row
        var p = new MenuItemPriceEntity();
        p.setTenantId(defs().tenantId());
        p.setMenuItemId(e.getId());
        p.setVariantName("BASE");
        p.setPrice(price);
        p.setValidFrom(null);
        p.setValidTo(null);
        priceRepo.save(p);

        return toDto(e);
    }

    // =========================================================
    // UPDATE
    // =========================================================
    @Override
    public ItemResponse update(UUID id, ItemUpdateRequest req) {
        var e = find(id);

        if (req.name() != null)
            e.setName(req.name());
        if (req.categoryId() != null)
            e.setCategoryId(req.categoryId());
        if (req.description() != null)
            e.setDescription(req.description());
        if (req.imageUrl() != null)
            e.setImageUrl(req.imageUrl()); // vẫn cho phép update bằng url
        if (req.status() != null)
            e.setAvailable("ACTIVE".equalsIgnoreCase(req.status()));

        e = itemRepo.save(e);
        return toDto(e);
    }

    // =========================================================
    // ✅ UPLOAD IMAGE (NEW)
    // =========================================================
    @Override
    public ItemResponse uploadImage(UUID itemId, MultipartFile file) throws IOException {
        var e = find(itemId);

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        String contentType = file.getContentType();
        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        // ✅ Cho phép đúng các định dạng bạn đang support trong UploadGateway
        if (!isAllowedImageContentType(contentType)) {
            throw new IllegalArgumentException("Only PNG/JPG/WEBP are allowed");
        }

        // (tuỳ chọn) giới hạn size
        long maxBytes = 5L * 1024 * 1024; // 5MB
        if (file.getSize() > maxBytes) {
            throw new IllegalArgumentException("Max file size is 5MB");
        }

        // ✅ objectKey: không cần ext, gateway sẽ tự append theo contentType
        String objectKey = "menu/items/" + e.getId() + "/cover";
        String url = upload.upload(objectKey, file.getBytes(), normalizeContentType(contentType));

        e.setImageUrl(url);
        e = itemRepo.save(e);

        return toDto(e);
    }

    private static boolean isAllowedImageContentType(String ct) {
        String c = ct.toLowerCase(Locale.ROOT);
        return c.equals("image/png")
                || c.equals("image/jpeg")
                || c.equals("image/jpg")
                || c.equals("image/webp");
    }

    private static String normalizeContentType(String ct) {
        if (ct == null)
            return "application/octet-stream";
        return ct.equalsIgnoreCase("image/jpg") ? "image/jpeg" : ct;
    }

    // =========================================================
    // PUBLISH
    // =========================================================
    @Override
    public ItemResponse publish(UUID id, ItemPublishPatchRequest req) {
        var e = find(id);
        String status = (req.status() == null) ? "ACTIVE" : req.status();
        e.setAvailable("ACTIVE".equalsIgnoreCase(status));
        e = itemRepo.save(e);
        return toDto(e);
    }

    // =========================================================
    // DELETE (soft -> INACTIVE)
    // =========================================================
    @Override
    public void delete(UUID id) {
        var e = find(id);
        e.setAvailable(false);
        itemRepo.save(e);
    }

    // =========================================================
    // DUPLICATE
    // =========================================================
    @Override
    public DuplicateItemResponse duplicate(UUID id) {
        var src = find(id);

        var dup = new MenuItemEntity();
        dup.setTenantId(src.getTenantId());
        dup.setOutletId(src.getOutletId());
        dup.setCategoryId(src.getCategoryId());
        dup.setName(src.getName() + " (Copy)");

        dup.setCode(src.getCode() + "-COPY");
        dup.setDescription(src.getDescription());
        dup.setImageUrl(src.getImageUrl());
        dup.setThumbnailUrl(src.getThumbnailUrl());
        dup.setBasePrice(src.getBasePrice() != null ? src.getBasePrice() : BigDecimal.ZERO);

        dup.setAvailable(false);

        dup = itemRepo.save(dup);
        return new DuplicateItemResponse(dup.getId());
    }

    // =========================================================
    // DETAIL + EFFECTIVE PRICE
    // =========================================================
    @Override
    @Transactional(readOnly = true)
    public ItemDetailResponse getDetailWithEffectivePrice(UUID id, UUID outletId, Instant at) {
        var item = toDto(find(id));

        UUID tenantId = defs().tenantId();

        var optionEntities = optRepo.findByTenantIdAndItemIdOrderByNameAsc(tenantId, id);

        var options = optionEntities.stream()
                .map(o -> new OptionResponse(
                        o.getId(),
                        o.getItemId(),
                        o.getName(),
                        o.getRequired(),
                        "MULTI".equalsIgnoreCase(o.getSelectionType()),
                        null,
                        null))
                .toList();

        List<OptionValueGrouped> groups = new ArrayList<>();
        for (var o : options) {
            List<MenuOptionValueEntity> valueEntities = valRepo.findByMenuOptionIdOrderBySortOrderAscNameAsc(o.id());

            var vals = valueEntities.stream()
                    .map(v -> new OptionValueResponse(
                            v.getId(),
                            v.getMenuOptionId(),
                            v.getName(),
                            v.getExtraPrice(),
                            v.getSortOrder()))
                    .toList();

            groups.add(new OptionValueGrouped(o.id(), o.name(), vals));
        }

        var effectiveAt = (at == null) ? Instant.now() : at;
        var price = (outletId == null)
                ? null
                : priceService.getEffectivePrice(id, outletId, effectiveAt);

        return new ItemDetailResponse(item, options, groups, price);
    }

    // =========================================================
    // Helpers
    // =========================================================
    private MenuItemEntity find(UUID id) {
        return itemRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Item not found"));
    }

    private ItemResponse toDto(MenuItemEntity e) {
        String status = Boolean.TRUE.equals(e.getAvailable()) ? "ACTIVE" : "INACTIVE";
        List<String> tags = List.of();

        return new ItemResponse(
                e.getId(),
                e.getName(),
                e.getCode(),
                e.getCategoryId(),
                e.getDescription(),
                e.getImageUrl(),
                status,
                tags,
                e.getCreatedAt(),
                e.getUpdatedAt());
    }
}
