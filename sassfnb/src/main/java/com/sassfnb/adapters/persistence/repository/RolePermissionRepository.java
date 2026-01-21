// com/sassfnb/adapters/persistence/repository/RolePermissionRepository.java
package com.sassfnb.adapters.persistence.repository;

import com.sassfnb.adapters.persistence.entity.RolePermissionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

import java.util.List;
import java.util.UUID;

public interface RolePermissionRepository extends JpaRepository<RolePermissionEntity, UUID> {
    List<RolePermissionEntity> findByRoleId(UUID roleId);

    @Modifying
    void deleteByRoleId(UUID roleId);

    List<RolePermissionEntity> findAllByRoleIdIn(List<UUID> roleIds);

    List<RolePermissionEntity> findAllByRoleId(UUID roleId);

}
