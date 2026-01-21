package com.sassfnb.adapters.persistence.repository;

import com.sassfnb.adapters.persistence.entity.PermissionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PermissionRepository extends JpaRepository<PermissionEntity, UUID> {

    Optional<PermissionEntity> findByCode(String code);

    List<PermissionEntity> findAllByOrderByCodeAsc();

    List<PermissionEntity> findAll();

    List<PermissionEntity> findByIdIn(java.util.Collection<UUID> ids);

}
