// src/main/java/com/sassfnb/adapters/rest/controller/RestaurantController.java
package com.sassfnb.adapters.rest.controller;

import com.sassfnb.adapters.rest.dto.tenant.RestaurantDtos.RestaurantCreateRequest;
import com.sassfnb.adapters.rest.dto.tenant.RestaurantDtos.RestaurantResponse;
import com.sassfnb.adapters.rest.dto.tenant.RestaurantDtos.RestaurantStatusPatchRequest;
import com.sassfnb.adapters.rest.dto.tenant.RestaurantDtos.RestaurantUpdateRequest;
import com.sassfnb.application.service.RestaurantService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1") // đồng bộ với SecurityConfig & Jwt filter
@RequiredArgsConstructor
public class RestaurantController {

    private final RestaurantService service;

    // Lấy nhà hàng hiện tại theo tenant (owner đang đăng nhập)
    @GetMapping("/restaurants/me")
    @PreAuthorize("isAuthenticated()")
    public RestaurantResponse me() {
        return service.getMyRestaurant();
    }

    // Cập nhật thông tin nhà hàng của chính mình
    @PutMapping("/restaurants/me")
    @PreAuthorize("isAuthenticated()")
    public RestaurantResponse updateMe(@RequestBody RestaurantUpdateRequest req) {
        return service.updateMyRestaurant(req);
    }

    // Cập nhật thông tin nhà hàng theo id
    @PutMapping("/restaurants/{id}")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN')")
    public RestaurantResponse update(@PathVariable UUID id,
            @RequestBody RestaurantUpdateRequest req) {
        return service.updateRestaurant(id, req);
    }

    // Danh sách nhà hàng thuộc owner hiện tại (lọc q, status)
    @GetMapping("/restaurants")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN')")
    public Page<RestaurantResponse> list(@RequestParam(required = false) String q,
            @RequestParam(required = false) String status,
            Pageable pageable) {
        return service.listOwnedRestaurants(q, status, pageable);
    }

    // Tạo nhà hàng mới (ROOT/OWNER/ADMIN)
    @PostMapping("/restaurants")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN')")
    public RestaurantResponse create(@RequestBody RestaurantCreateRequest req) {
        return service.createRestaurant(req);
    }

    // Lấy chi tiết 1 nhà hàng theo id
    @GetMapping("/restaurants/{id}")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN')")
    public RestaurantResponse get(@PathVariable UUID id) {
        return service.getRestaurant(id);
    }

    // Đổi trạng thái nhà hàng
    @PatchMapping("/restaurants/{id}/status")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN')")
    public void patchStatus(@PathVariable UUID id,
            @RequestBody RestaurantStatusPatchRequest req) {
        service.patchRestaurantStatus(id, req);
    }

    @DeleteMapping("/restaurants/{id}")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN')")
    public void delete(@PathVariable UUID id) {
        service.patchRestaurantStatus(id, new RestaurantStatusPatchRequest("ARCHIVED"));
    }
}
