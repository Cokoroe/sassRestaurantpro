package com.sassfnb.application.service;

import com.sassfnb.adapters.rest.dto.tenant.TenantDtos.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface TenantService {

    TenantResponse createTenant(TenantCreateRequest req);

    TenantResponse getTenant(UUID id);

    Page<TenantResponse> listTenants(String q, String status, Pageable pageable);

    TenantResponse updateTenant(UUID id, TenantUpdateRequest req);

    void patchTenantStatus(UUID id, TenantStatusPatchRequest req);
}
