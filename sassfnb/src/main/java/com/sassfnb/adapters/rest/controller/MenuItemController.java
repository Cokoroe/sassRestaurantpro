package com.sassfnb.adapters.rest.controller;

import com.sassfnb.adapters.rest.dto.menu.MenuDtos.*;
import com.sassfnb.application.service.MenuItemService;
import com.sassfnb.application.service.MenuOptionService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/menu/items")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class MenuItemController {

    private final MenuItemService itemService;
    private final MenuOptionService optionService;

    // LIST
    @GetMapping
    public Page<ItemResponse> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Boolean isFeatured,
            @RequestParam(required = false) UUID outletId,
            @RequestParam(required = false) Boolean hasOptions,
            Pageable pageable) {

        if (q != null && q.isBlank())
            q = null;
        if (status != null && status.isBlank())
            status = null;

        return itemService.list(new ItemListRequest(q, categoryId, status, isFeatured, outletId, hasOptions), pageable);
    }

    // CREATE
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','MANAGER')")
    public ItemResponse create(@RequestBody @Valid ItemCreateRequest req) {
        return itemService.create(req);
    }

    // ✅ NEW: UPLOAD IMAGE (multipart)
    @PostMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','MANAGER')")
    public ItemResponse uploadImage(@PathVariable UUID id,
            @RequestPart("file") MultipartFile file) throws IOException {
        return itemService.uploadImage(id, file);
    }

    // DETAIL (+ giá hiệu lực)
    @GetMapping("/{id}")
    public ItemDetailResponse getDetail(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID outletId,
            @RequestParam(required = false) Instant at) {
        return itemService.getDetailWithEffectivePrice(id, outletId, at);
    }

    // UPDATE
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','MANAGER')")
    public ItemResponse update(@PathVariable UUID id, @RequestBody ItemUpdateRequest req) {
        return itemService.update(id, req);
    }

    // PUBLISH (PATCH)
    @PatchMapping("/{id}/publish")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','MANAGER')")
    public ItemResponse publish(@PathVariable UUID id, @RequestBody ItemPublishPatchRequest req) {
        return itemService.publish(id, req);
    }

    // DELETE
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','MANAGER')")
    public void delete(@PathVariable UUID id) {
        itemService.delete(id);
    }

    // DUPLICATE
    @PostMapping("/{id}/duplicate")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','MANAGER')")
    public DuplicateItemResponse duplicate(@PathVariable UUID id) {
        return itemService.duplicate(id);
    }

    // OPTIONS
    @GetMapping("/{id}/options")
    public List<OptionResponse> listOptions(@PathVariable UUID id) {
        return optionService.listOptionsByItem(id);
    }
}
