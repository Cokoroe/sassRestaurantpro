package com.sassfnb.adapters.persistence.repository;

import com.sassfnb.adapters.persistence.entity.RoleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;
import java.util.List;

public interface RoleRepository extends JpaRepository<RoleEntity, UUID> {
    Optional<RoleEntity> findByCode(String code);

    List<RoleEntity> findAllByOrderByNameAsc();

    boolean existsByCodeIgnoreCase(String code);

    Optional<RoleEntity> findByCodeIgnoreCase(String code);

}
