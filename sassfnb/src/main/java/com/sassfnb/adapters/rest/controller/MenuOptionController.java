package com.sassfnb.adapters.rest.controller;

import com.sassfnb.adapters.rest.dto.menu.MenuDtos.*;
import com.sassfnb.application.service.MenuOptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/menu/options")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','STAFF')")
public class MenuOptionController {

    private final MenuOptionService service;

    // ---- OPTIONS (không dùng lại /menu/items/** để tránh trùng) ----

    // Danh sách option theo item
    @GetMapping("/by-item/{itemId}")
    public List<OptionResponse> listOptionsByItem(@PathVariable UUID itemId) {
        return service.listOptionsByItem(itemId);
    }

    // Tạo option cho 1 item
    @PostMapping("/item/{itemId}")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN')")
    public OptionResponse addOption(
            @PathVariable UUID itemId,
            @RequestBody OptionCreateRequest req) {
        return service.addOption(itemId, req);
    }

    // Cập nhật / Xoá option
    @PutMapping("/{optionId}")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN')")
    public OptionResponse updateOption(
            @PathVariable UUID optionId,
            @RequestBody OptionUpdateRequest req) {
        return service.updateOption(optionId, req);
    }

    @DeleteMapping("/{optionId}")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN')")
    public void deleteOption(@PathVariable UUID optionId) {
        service.deleteOption(optionId);
    }

    // ---- OPTION VALUES ----

    @GetMapping("/{optionId}/values")
    public List<OptionValueResponse> listValues(@PathVariable UUID optionId) {
        return service.listValues(optionId);
    }

    @PostMapping("/{optionId}/values")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN')")
    public OptionValueResponse addValue(
            @PathVariable UUID optionId,
            @RequestBody OptionValueCreateRequest req) {
        return service.addValue(optionId, req);
    }

    @PutMapping("/values/{valueId}")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN')")
    public OptionValueResponse updateValue(
            @PathVariable UUID valueId,
            @RequestBody OptionValueUpdateRequest req) {
        return service.updateValue(valueId, req);
    }

    @DeleteMapping("/values/{valueId}")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN')")
    public void deleteValue(@PathVariable UUID valueId) {
        service.deleteValue(valueId);
    }
}
