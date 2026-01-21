// src/main/java/com/sassfnb/application/service/MenuCategoryService.java
package com.sassfnb.application.service;

import com.sassfnb.adapters.rest.dto.menu.MenuDtos.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface MenuCategoryService {
    Page<CategoryResponse> list(CategoryListRequest req, Pageable pageable);

    CategoryResponse create(CategoryCreateRequest req);

    CategoryResponse get(UUID id);

    CategoryResponse update(UUID id, CategoryUpdateRequest req);

    void delete(UUID id, boolean cascade);

    void reorder(UUID id, CategoryReorderRequest req);

    List<CategoryTreeNode> tree(String status);
}
