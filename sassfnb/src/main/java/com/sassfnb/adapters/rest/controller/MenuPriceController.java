package com.sassfnb.adapters.rest.controller;

import com.sassfnb.adapters.rest.dto.menu.MenuDtos.*;
import com.sassfnb.application.service.MenuPriceService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/menu/items")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','STAFF')")
public class MenuPriceController {

    private final MenuPriceService service;

    @GetMapping("/{id}/prices")
    public List<PriceResponse> listPrices(@PathVariable UUID id,
            @RequestParam(required = false) UUID outletId) {
        return service.listPrices(id, outletId);
    }

    @PostMapping("/{id}/prices")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN')")
    public PriceResponse createPrice(@PathVariable UUID id, @RequestBody PriceCreateRequest req) {
        return service.createPrice(id, req);
    }

    @PutMapping("/{id}/prices/{priceId}")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN')")
    public PriceResponse updatePrice(@PathVariable UUID id, @PathVariable UUID priceId,
            @RequestBody PriceUpdateRequest req) {
        return service.updatePrice(id, priceId, req);
    }

    @PatchMapping("/{id}/prices/{priceId}/activate")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN')")
    public PriceResponse activate(@PathVariable UUID id, @PathVariable UUID priceId,
            @RequestBody PriceActivatePatchRequest req) {
        return service.activatePrice(id, priceId, req);
    }

    @DeleteMapping("/{id}/prices/{priceId}")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN')")
    public void deletePrice(@PathVariable UUID id, @PathVariable UUID priceId) {
        service.deletePrice(id, priceId);
    }

    @GetMapping("/{id}/price-effective")
    public PriceResponse priceEffective(@PathVariable UUID id,
            @RequestParam(required = false) UUID outletId,
            @RequestParam(required = false) Instant at) {
        return service.getEffectivePrice(id, outletId, at);
    }
}
