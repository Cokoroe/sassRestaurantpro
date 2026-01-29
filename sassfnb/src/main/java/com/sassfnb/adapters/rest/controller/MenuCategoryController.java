// src/main/java/com/sassfnb/adapters/rest/controller/MenuCategoryController.java
package com.sassfnb.adapters.rest.controller;

import com.sassfnb.adapters.rest.dto.menu.MenuDtos.*;
import com.sassfnb.application.service.MenuCategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/menu/categories")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class MenuCategoryController {

    private final MenuCategoryService service;

    // ✅ GET /api/v1/menu/categories?outletId=...&q=...&status=...&page=0&size=100
    @GetMapping
    public Page<CategoryResponse> list(
            @RequestParam(required = false) UUID outletId,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status,
            Pageable pageable) {
        return service.list(new CategoryListRequest(outletId, q, status), pageable);
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','MANAGER')")
    public CategoryResponse create(@RequestBody @Valid CategoryCreateRequest req) {
        return service.create(req);
    }

    @GetMapping("/{id}")
    public CategoryResponse get(@PathVariable UUID id) {
        return service.get(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','MANAGER')")
    public CategoryResponse update(@PathVariable UUID id, @RequestBody CategoryUpdateRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','MANAGER')")
    public void delete(@PathVariable UUID id, @RequestParam(defaultValue = "false") boolean cascade) {
        service.delete(id, cascade);
    }

    @PatchMapping("/{id}/reorder")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','MANAGER')")
    public void reorder(@PathVariable UUID id, @RequestBody CategoryReorderRequest req) {
        service.reorder(id, req);
    }

    @GetMapping("/tree")
    public List<CategoryTreeNode> tree(@RequestParam(required = false) String status) {
        return service.tree(status);
    }
}
