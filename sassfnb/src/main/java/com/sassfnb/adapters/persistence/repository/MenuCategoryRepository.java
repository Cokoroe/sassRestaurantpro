// src/main/java/com/sassfnb/adapters/persistence/repository/MenuCategoryRepository.java
package com.sassfnb.adapters.persistence.repository;

import com.sassfnb.adapters.persistence.entity.MenuCategoryEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface MenuCategoryRepository extends JpaRepository<MenuCategoryEntity, UUID> {

  @Query(value = """
        SELECT *
        FROM menu_categories c
        WHERE c.outlet_id = :outletId
          AND (:q IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', CAST(:q AS text), '%')))
          AND (:status IS NULL OR c.status = :status)
        ORDER BY COALESCE(c.sort_order, 0), c.name
      """, countQuery = """
        SELECT count(*)
        FROM menu_categories c
        WHERE c.outlet_id = :outletId
          AND (:q IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', CAST(:q AS text), '%')))
          AND (:status IS NULL OR c.status = :status)
      """, nativeQuery = true)
  Page<MenuCategoryEntity> search(
      @Param("outletId") UUID outletId,
      @Param("q") String q,
      @Param("status") String status,
      Pageable pageable);

  List<MenuCategoryEntity> findByOutletIdOrderBySortOrderAscNameAsc(UUID outletId);

  boolean existsByOutletIdAndNameIgnoreCase(UUID outletId, String name);
}
