package com.sassfnb.adapters.persistence.repository;

import com.sassfnb.adapters.persistence.entity.UserEntity;
// import com.sassfnb.adapters.persistence.entity.UserRoleEntity;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
// import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<UserEntity, UUID> {
    Optional<UserEntity> findByEmailIgnoreCase(String email);

    List<UserEntity> findByIdIn(Collection<UUID> ids);

    // List<UserRoleEntity> findAllByUserId(UUID userId);

    // List<UserEntity> findAllByIdAndRestaurantId(UUID id, UUID restaurantId);

    // List<UserRoleEntity> findAllByUserIdAndRestaurantIdAndOutletId(UUID userId,
    // UUID restaurantId, UUID outletId);
}
