package com.sassfnb.adapters.persistence.repository;

import com.sassfnb.adapters.persistence.entity.MenuItemEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MenuItemRepository extends JpaRepository<MenuItemEntity, UUID> {

  // Search item theo outlet + q + categoryId (status hiện mình dùng cột
  // isAvailable)
  @Query(value = """
        SELECT *
        FROM menu_items i
        WHERE i.outlet_id = :outletId
          AND (:q IS NULL OR i.name ILIKE CONCAT('%', :q, '%'))
          AND (:categoryId IS NULL OR i.category_id = :categoryId)
          AND (:status IS NULL
               OR (:status = 'ACTIVE' AND i.is_available = true)
               OR (:status = 'INACTIVE' AND i.is_available = false))
        ORDER BY i.created_at DESC
      """, countQuery = """
        SELECT COUNT(*)
        FROM menu_items i
        WHERE i.outlet_id = :outletId
          AND (:q IS NULL OR i.name ILIKE CONCAT('%', :q, '%'))
          AND (:categoryId IS NULL OR i.category_id = :categoryId)
          AND (:status IS NULL
               OR (:status = 'ACTIVE' AND i.is_available = true)
               OR (:status = 'INACTIVE' AND i.is_available = false))
      """, nativeQuery = true)
  Page<MenuItemEntity> search(
      @Param("outletId") UUID outletId,
      @Param("q") String q,
      @Param("categoryId") UUID categoryId,
      @Param("status") String status,
      Pageable pageable);

  // Lấy tất cả món trong 1 outlet
  List<MenuItemEntity> findByOutletId(UUID outletId);

  // Kiểm tra trùng code trong outlet
  boolean existsByOutletIdAndCode(UUID outletId, String code);

  // Tìm 1 item theo outlet + code
  Optional<MenuItemEntity> findByOutletIdAndCode(UUID outletId, String code);

  Optional<MenuItemEntity> findByIdAndOutletId(UUID id, UUID outletId);

}
