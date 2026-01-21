package com.sassfnb.adapters.persistence.repository;

import com.sassfnb.adapters.persistence.entity.MenuItemPriceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MenuItemPriceRepository extends JpaRepository<MenuItemPriceEntity, UUID> {

  List<MenuItemPriceEntity> findByMenuItemIdOrderByCreatedAtDesc(UUID menuItemId);

  @Query("""
          select p from MenuItemPriceEntity p
          where p.menuItemId = :itemId
            and (:at is null
                 or (p.validFrom is null or p.validFrom <= :at)
                and (p.validTo is null or p.validTo >= :at))
          order by p.createdAt desc
      """)
  Optional<MenuItemPriceEntity> findEffectivePrice(
      @Param("itemId") UUID itemId,
      @Param("at") Instant at);

  Optional<MenuItemPriceEntity> findByIdAndMenuItemId(UUID id, UUID menuItemId);

  // ✅ NEW: lấy effective theo at (at bắt buộc NOT NULL)
  @Query("""
          select p from MenuItemPriceEntity p
          where p.menuItemId = :itemId
            and (p.validFrom is null or p.validFrom <= :at)
            and (p.validTo is null or p.validTo >= :at)
          order by p.createdAt desc
      """)
  Optional<MenuItemPriceEntity> findEffectivePriceAt(
      @Param("itemId") UUID itemId,
      @Param("at") Instant at);

  // ✅ NEW: fallback lấy record mới nhất
  Optional<MenuItemPriceEntity> findTopByMenuItemIdOrderByCreatedAtDesc(UUID menuItemId);

}
