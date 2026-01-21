// src/main/java/com/sassfnb/application/service/MenuItemService.java
package com.sassfnb.application.service;

import com.sassfnb.adapters.rest.dto.menu.MenuDtos.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.UUID;

public interface MenuItemService {
    Page<ItemResponse> list(ItemListRequest req, Pageable pageable);

    ItemResponse create(ItemCreateRequest req);

    ItemResponse update(UUID itemId, ItemUpdateRequest req);

    ItemResponse publish(UUID itemId, ItemPublishPatchRequest req);

    void delete(UUID itemId);

    DuplicateItemResponse duplicate(UUID itemId);

    ItemDetailResponse getDetailWithEffectivePrice(UUID itemId, UUID outletId, Instant at);

    // ✅ NEW: upload ảnh -> tự lưu imageUrl vào DB và trả về ItemResponse
    ItemResponse uploadImage(UUID itemId, MultipartFile file) throws IOException;

}
