package com.sassfnb.adapters.rest.controller;

// src/main/java/com/sassfnb/controller/OutletController.java

import com.sassfnb.adapters.rest.dto.tenant.OutletDtos.OutletCreateRequest;
import com.sassfnb.adapters.rest.dto.tenant.OutletDtos.OutletHoursUpdateRequest;
import com.sassfnb.adapters.rest.dto.tenant.OutletDtos.OutletResponse;
import com.sassfnb.adapters.rest.dto.tenant.OutletDtos.OutletUpdateRequest;
import com.sassfnb.application.service.OutletService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
// CHỈNH: dùng authority, không dùng role
@PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','STAFF')")
public class OutletController {
    private final OutletService service;

    @GetMapping("/outlets")
    public Page<OutletResponse> list(
            @RequestParam(required = false) UUID restaurantId, // <--- thêm
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Boolean isDefault,
            Pageable pageable) {
        return service.listOutlets(restaurantId, q, city, isDefault, pageable);
    }

    @PostMapping("/outlets")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN')")
    public OutletResponse create(@RequestBody OutletCreateRequest req) {
        return service.createOutlet(req);
    }

    @GetMapping("/outlets/{id}")
    public OutletResponse get(@PathVariable UUID id) {
        return service.getOutlet(id);
    }

    @PutMapping("/outlets/{id}")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN')")
    public OutletResponse update(@PathVariable UUID id, @RequestBody OutletUpdateRequest req) {
        return service.updateOutlet(id, req);
    }

    @DeleteMapping("/outlets/{id}")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN')")
    public void delete(@PathVariable UUID id) {
        service.deleteOutlet(id);
    }

    @PatchMapping("/outlets/{id}/make-default")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN')")
    public void makeDefault(@PathVariable UUID id) {
        service.makeDefault(id);
    }

    @GetMapping("/outlets/{id}/hours")
    public String getHours(@PathVariable UUID id) {
        return service.getHours(id);
    }

    @PutMapping("/outlets/{id}/hours")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN')")
    public void updateHours(@PathVariable UUID id, @RequestBody OutletHoursUpdateRequest req) {
        service.updateHours(id, req);
    }
}
