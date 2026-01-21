package com.sassfnb.adapters.rest.controller;

import com.sassfnb.adapters.rest.dto.publicmenu.PublicMenuDtos.PublicMenuTreeResponse;
import com.sassfnb.application.service.PublicMenuService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/public/menu")
@RequiredArgsConstructor
public class PublicMenuController {

    private final PublicMenuService service;

    // ✅ GET /api/v1/public/menu/tree?orderId=...
    // (optional) &at=2026-01-14T12:00:00Z
    @GetMapping("/tree")
    public PublicMenuTreeResponse tree(
            @RequestParam(required = false) UUID orderId,
            @RequestParam(required = false) UUID outletId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant at) {
        return service.tree(orderId, outletId, at);
    }
}
