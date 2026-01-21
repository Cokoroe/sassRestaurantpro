package com.sassfnb.application.service.impl;

import com.sassfnb.adapters.persistence.entity.MenuOptionValueEntity;
import com.sassfnb.adapters.persistence.repository.*;
import com.sassfnb.adapters.rest.dto.publicmenu.PublicMenuDtos.*;
import com.sassfnb.application.service.MenuPriceService;
import com.sassfnb.application.service.PublicMenuService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PublicMenuServiceImpl implements PublicMenuService {

    private static final UUID UNCATEGORIZED_ID = UUID.fromString("00000000-0000-0000-0000-000000000000");

    private final OrderRepository orderRepo;

    private final MenuCategoryRepository catRepo;
    private final MenuItemRepository itemRepo;

    private final MenuOptionRepository optRepo;
    private final MenuOptionValueRepository valRepo;

    private final MenuPriceService priceService;

    @Override
    public PublicMenuTreeResponse tree(UUID orderId, UUID outletId, Instant at) {
        // 1) Resolve outletId + tenantId ưu tiên từ order
        UUID resolvedOutletId = outletId;

        if (orderId != null) {
            var o = orderRepo.findById(orderId)
                    .orElseThrow(() -> new NoSuchElementException("Order not found: " + orderId));
            resolvedOutletId = o.getOutletId();
        }

        if (resolvedOutletId == null) {
            throw new IllegalArgumentException("Missing outletId (or orderId)");
        }

        Instant effectiveAt = (at != null) ? at : Instant.now();

        // 2) Load categories của outlet (chỉ ACTIVE)
        var categories = new ArrayList<>(catRepo.findByOutletIdOrderBySortOrderAscNameAsc(resolvedOutletId));
        categories.removeIf(c -> c.getStatus() != null && !"ACTIVE".equalsIgnoreCase(c.getStatus()));

        // 3) Load items của outlet (chỉ available=true => ACTIVE)
        var itemsAll = new ArrayList<>(itemRepo.findByOutletId(resolvedOutletId));
        itemsAll.removeIf(i -> !Boolean.TRUE.equals(i.getAvailable()));

        // group items theo categoryId (null => UNCATEGORIZED_ID)
        Map<UUID, List<com.sassfnb.adapters.persistence.entity.MenuItemEntity>> itemsByCat = itemsAll.stream()
                .collect(Collectors.groupingBy(i -> i.getCategoryId() == null ? UNCATEGORIZED_ID : i.getCategoryId()));

        // 4) Build tree
        List<CategoryNode> catNodes = new ArrayList<>();

        for (var c : categories) {
            UUID catId = c.getId();
            List<com.sassfnb.adapters.persistence.entity.MenuItemEntity> catItems = itemsByCat.getOrDefault(catId,
                    List.of());

            List<ItemNode> itemNodes = buildItemNodes(catItems, resolvedOutletId, effectiveAt);

            catNodes.add(new CategoryNode(
                    c.getId(),
                    c.getName(),
                    c.getSortOrder(),
                    itemNodes));
        }

        // ✅ 5) Add "Khác" nếu có items category null
        List<com.sassfnb.adapters.persistence.entity.MenuItemEntity> uncategorizedItems = itemsByCat
                .getOrDefault(UNCATEGORIZED_ID, List.of());

        if (!uncategorizedItems.isEmpty()) {
            List<ItemNode> itemNodes = buildItemNodes(uncategorizedItems, resolvedOutletId, effectiveAt);

            catNodes.add(new CategoryNode(
                    UNCATEGORIZED_ID,
                    "Khác",
                    999999,
                    itemNodes));
        }

        // currency: hiện tại tạm hardcode
        String currency = "VND";

        return new PublicMenuTreeResponse(resolvedOutletId, currency, effectiveAt, catNodes);
    }

    private List<ItemNode> buildItemNodes(
            List<com.sassfnb.adapters.persistence.entity.MenuItemEntity> items,
            UUID outletId,
            Instant effectiveAt) {
        List<ItemNode> itemNodes = new ArrayList<>();

        for (var item : items) {
            // effective price
            var p = priceService.getEffectivePrice(item.getId(), outletId, effectiveAt);
            var effectivePrice = (p != null && p.basePrice() != null) ? p.basePrice() : item.getBasePrice();

            // options theo item
            var optEntities = optRepo.findByItemIdOrderByNameAsc(item.getId());
            List<OptionNode> optNodes = new ArrayList<>();

            for (var o : optEntities) {
                List<MenuOptionValueEntity> valEntities = valRepo
                        .findByMenuOptionIdOrderBySortOrderAscNameAsc(o.getId());

                List<OptionValueNode> values = valEntities.stream()
                        .map(v -> new OptionValueNode(
                                v.getId(),
                                v.getName(),
                                v.getExtraPrice(),
                                v.getSortOrder()))
                        .toList();

                boolean isMulti = "MULTI".equalsIgnoreCase(o.getSelectionType());

                optNodes.add(new OptionNode(
                        o.getId(),
                        o.getName(),
                        o.getRequired(),
                        isMulti,
                        values));
            }

            itemNodes.add(new ItemNode(
                    item.getId(),
                    item.getName(),
                    item.getDescription(),
                    item.getImageUrl(),
                    effectivePrice,
                    optNodes));
        }

        return itemNodes;
    }
}
