package com.sassfnb.adapters.rest.controller;

import com.sassfnb.adapters.rest.dto.tenant.TenantDtos.*;
import com.sassfnb.application.service.TenantService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tenants")
@RequiredArgsConstructor
public class TenantController {

    private final TenantService service;

    // Tạo tenant mới – chỉ ROOT
    @PostMapping
    @PreAuthorize("hasAuthority('ROOT')")
    public TenantResponse create(@RequestBody TenantCreateRequest req) {
        return service.createTenant(req);
    }

    // Lấy chi tiết 1 tenant
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ROOT')")
    public TenantResponse get(@PathVariable UUID id) {
        return service.getTenant(id);
    }

    // Danh sách tenant có filter q (name) + status
    @GetMapping
    @PreAuthorize("hasAuthority('ROOT')")
    public Page<TenantResponse> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status,
            Pageable pageable) {
        return service.listTenants(q, status, pageable);
    }

    // Cập nhật thông tin tenant
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROOT')")
    public TenantResponse update(
            @PathVariable UUID id,
            @RequestBody TenantUpdateRequest req) {
        return service.updateTenant(id, req);
    }

    // Đổi trạng thái tenant (ACTIVE / SUSPENDED / DELETED ...)
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('ROOT')")
    public void patchStatus(
            @PathVariable UUID id,
            @RequestBody TenantStatusPatchRequest req) {
        service.patchTenantStatus(id, req);
    }
}
