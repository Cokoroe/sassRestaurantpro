package com.sassfnb.adapters.rest.controller;

import com.sassfnb.adapters.rest.dto.staff.StaffDtos.*;
import com.sassfnb.application.service.StaffService;
import com.sassfnb.config.jwt.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/staffs")
@RequiredArgsConstructor
public class StaffController {

    private final StaffService staffService;

    // ========== OWNER/ROOT/ADMIN: CRUD ==========

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER')")
    public Page<StaffResponse> list(
            Authentication auth,
            @RequestParam(required = false) UUID restaurantId,
            @RequestParam(required = false) UUID outletId,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {

        var principal = (UserPrincipal) auth.getPrincipal();
        UUID tenantId = principal.getTenantId();

        StaffListParams params = new StaffListParams();
        params.setRestaurantId(restaurantId);
        params.setOutletId(outletId);
        params.setQ(q);
        params.setStatus(status);
        params.setPage(page);
        params.setSize(size);

        return staffService.listStaff(tenantId, params);
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN')")
    public StaffResponse create(Authentication auth, @RequestBody StaffCreateRequest req) {
        var principal = (UserPrincipal) auth.getPrincipal();
        return staffService.createStaff(principal.getTenantId(), principal.getUserId(), req);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER')")
    public StaffResponse get(Authentication auth, @PathVariable UUID id) {
        var principal = (UserPrincipal) auth.getPrincipal();
        return staffService.getStaff(principal.getTenantId(), id);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN')")
    public StaffResponse update(Authentication auth, @PathVariable UUID id, @RequestBody StaffUpdateRequest req) {
        var principal = (UserPrincipal) auth.getPrincipal();
        return staffService.updateStaff(principal.getTenantId(), principal.getUserId(), id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN')")
    public void delete(Authentication auth, @PathVariable UUID id) {
        var principal = (UserPrincipal) auth.getPrincipal();
        staffService.deleteStaff(principal.getTenantId(), principal.getUserId(), id);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN')")
    public StaffResponse updateStatus(Authentication auth, @PathVariable UUID id,
            @RequestBody StaffStatusUpdateRequest req) {
        var principal = (UserPrincipal) auth.getPrincipal();
        return staffService.updateStatus(principal.getTenantId(), principal.getUserId(), id, req);
    }

    // ✅ NEW: UPLOAD AVATAR (multipart) — giống menu
    @PostMapping(value = "/{id}/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN')")
    public StaffResponse uploadAvatar(Authentication auth,
            @PathVariable UUID id,
            @RequestPart("file") MultipartFile file) throws IOException {
        var principal = (UserPrincipal) auth.getPrincipal();
        return staffService.uploadAvatar(principal.getTenantId(), principal.getUserId(), id, file);
    }

    // ========== for Scheduler dropdown ==========

    @GetMapping("/options")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER')")
    public List<StaffOptionResponse> options(Authentication auth, @RequestParam UUID outletId) {
        var principal = (UserPrincipal) auth.getPrincipal();
        return staffService.listOptions(principal.getTenantId(), outletId);
    }

    // ========== STAFF self ==========

    @GetMapping("/me")
    @PreAuthorize("hasAnyAuthority('STAFF','ROOT','OWNER','ADMIN','MANAGER')")
    public StaffResponse me(Authentication auth) {
        var principal = (UserPrincipal) auth.getPrincipal();
        return staffService.getMyStaffProfile(principal.getTenantId(), principal.getUserId());
    }
}
