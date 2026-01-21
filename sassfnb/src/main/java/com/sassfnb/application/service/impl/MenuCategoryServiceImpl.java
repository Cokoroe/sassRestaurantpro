// src/main/java/com/sassfnb/application/service/impl/MenuCategoryServiceImpl.java
package com.sassfnb.application.service.impl;

import com.sassfnb.adapters.persistence.entity.MenuCategoryEntity;
import com.sassfnb.adapters.persistence.repository.MenuCategoryRepository;
import com.sassfnb.adapters.rest.dto.menu.MenuDtos.*;
import com.sassfnb.application.ports.TenantResolver;
import com.sassfnb.application.service.MenuCategoryService;
import com.sassfnb.config.DevDefaultsProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class MenuCategoryServiceImpl implements MenuCategoryService {

    private final MenuCategoryRepository repo;
    private final TenantResolver ctx;
    private final DevDefaultsProperties dev;

    private ServiceDefaults defs() {
        return new ServiceDefaults(ctx, dev);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CategoryResponse> list(CategoryListRequest req, Pageable pageable) {
        UUID outletId = (req.outletId() != null) ? req.outletId() : defs().outletId();

        String q = (req.q() != null && req.q().isBlank()) ? null : req.q();
        String status = (req.status() != null && req.status().isBlank()) ? null : req.status();

        return repo.search(outletId, q, status, pageable).map(this::toDto);
    }

    @Override
    public CategoryResponse create(CategoryCreateRequest req) {
        UUID outletId = (req.outletId() != null) ? req.outletId() : defs().outletId();

        if (repo.existsByOutletIdAndNameIgnoreCase(outletId, req.name())) {
            throw new IllegalArgumentException("Category name already exists in this outlet");
        }

        var e = new MenuCategoryEntity();
        e.setTenantId(defs().tenantId());
        e.setOutletId(outletId);
        e.setName(req.name());
        e.setSortOrder(req.sortOrder());
        e.setStatus(req.status() == null ? "ACTIVE" : req.status());

        return toDto(repo.save(e));
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryResponse get(UUID id) {
        return toDto(find(id));
    }

    @Override
    public CategoryResponse update(UUID id, CategoryUpdateRequest req) {
        var e = find(id);

        if (req.name() != null && !req.name().isBlank()) {
            if (repo.existsByOutletIdAndNameIgnoreCase(e.getOutletId(), req.name())) {
                throw new IllegalArgumentException("Category name already exists");
            }
            e.setName(req.name());
        }
        if (req.sortOrder() != null)
            e.setSortOrder(req.sortOrder());
        if (req.status() != null && !req.status().isBlank())
            e.setStatus(req.status());

        return toDto(repo.save(e));
    }

    @Override
    public void delete(UUID id, boolean cascade) {
        var e = find(id);
        if (cascade)
            repo.delete(e);
        else {
            e.setStatus("DELETED");
            repo.save(e);
        }
    }

    @Override
    public void reorder(UUID id, CategoryReorderRequest req) {
        var e = find(id);
        e.setSortOrder(req.sortOrder());
        repo.save(e);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryTreeNode> tree(String status) {
        var outletId = defs().outletId();
        var all = new ArrayList<>(repo.findByOutletIdOrderBySortOrderAscNameAsc(outletId));

        if (status != null && !status.isBlank()) {
            all.removeIf(c -> !status.equals(c.getStatus()));
        }

        return all.stream()
                .map(c -> new CategoryTreeNode(
                        c.getId(),
                        c.getName(),
                        c.getSortOrder(),
                        c.getStatus(),
                        List.of()))
                .toList();
    }

    private MenuCategoryEntity find(UUID id) {
        return repo.findById(id).orElseThrow(() -> new NoSuchElementException("Category not found"));
    }

    private CategoryResponse toDto(MenuCategoryEntity e) {
        return new CategoryResponse(
                e.getId(),
                e.getName(),
                e.getSortOrder(),
                e.getStatus(),
                e.getCreatedAt(),
                e.getUpdatedAt());
    }
}
