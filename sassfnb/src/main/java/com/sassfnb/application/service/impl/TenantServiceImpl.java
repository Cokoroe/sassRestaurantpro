package com.sassfnb.application.service.impl;

import com.sassfnb.adapters.persistence.entity.TenantEntity;
import com.sassfnb.adapters.persistence.repository.TenantRepository;
import com.sassfnb.adapters.rest.dto.tenant.TenantDtos.*;
import com.sassfnb.application.service.TenantService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TenantServiceImpl implements TenantService {

    private final TenantRepository repo;

    private TenantResponse map(TenantEntity e) {
        return new TenantResponse(
                e.getId(),
                e.getName(),
                e.getCode(),
                e.getStatus(),
                e.getTimezone(),
                e.getCurrency(),
                e.getCreatedAt(),
                e.getUpdatedAt());
    }

    @Override
    @Transactional
    public TenantResponse createTenant(TenantCreateRequest req) {
        // có thể check trùng code
        repo.findByCodeIgnoreCase(req.code())
                .ifPresent(x -> {
                    throw new IllegalArgumentException("Tenant code already exists");
                });

        TenantEntity e = TenantEntity.builder()
                .name(req.name())
                .code(req.code())
                .timezone(req.timezone() != null ? req.timezone() : "Asia/Ho_Chi_Minh")
                .currency(req.currency() != null ? req.currency() : "VND")
                .status("ACTIVE")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        repo.save(e);
        return map(e);
    }

    @Override
    public TenantResponse getTenant(UUID id) {
        TenantEntity e = repo.findById(id).orElseThrow();
        return map(e);
    }

    @Override
    public Page<TenantResponse> listTenants(String q, String status, Pageable pageable) {
        if (q == null)
            q = "";
        if (status == null || status.isBlank())
            status = "";
        return repo
                .findByNameContainingIgnoreCaseAndStatusContainingIgnoreCase(q, status, pageable)
                .map(this::map);
    }

    @Override
    @Transactional
    public TenantResponse updateTenant(UUID id, TenantUpdateRequest req) {
        TenantEntity e = repo.findById(id).orElseThrow();
        e.setName(req.name());
        if (req.timezone() != null) {
            e.setTimezone(req.timezone());
        }
        if (req.currency() != null) {
            e.setCurrency(req.currency());
        }
        e.setUpdatedAt(Instant.now());
        return map(e);
    }

    @Override
    @Transactional
    public void patchTenantStatus(UUID id, TenantStatusPatchRequest req) {
        TenantEntity e = repo.findById(id).orElseThrow();
        e.setStatus(req.status());
        e.setUpdatedAt(Instant.now());
    }
}
