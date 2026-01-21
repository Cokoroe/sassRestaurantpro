package com.sassfnb.adapters.persistence.repository;

import com.sassfnb.adapters.persistence.entity.UserRoleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRoleRepository extends JpaRepository<UserRoleEntity, UUID> {
        List<UserRoleEntity> findByUserId(UUID userId);

        List<UserRoleEntity> findByUserIdAndRestaurantIdAndOutletId(UUID userId, UUID restaurantId, UUID outletId);

        List<UserRoleEntity> findByUserIdAndRestaurantId(UUID userId, UUID restaurantId);

        Optional<UserRoleEntity> findByUserIdAndRoleIdAndRestaurantIdAndOutletId(UUID userId, UUID roleId,
                        UUID restaurantId, UUID outletId);

        List<UserRoleEntity> findAllByUserId(UUID userId);

        List<UserRoleEntity> findAllByUserIdAndRestaurantId(UUID userId, UUID restaurantId);

        List<UserRoleEntity> findAllByUserIdAndRestaurantIdAndOutletId(UUID userId, UUID restaurantId, UUID outletId);

        boolean existsByUserIdAndRoleIdAndRestaurantIdAndOutletId(
                        UUID userId,
                        UUID roleId,
                        UUID restaurantId,
                        UUID outletId);
}
