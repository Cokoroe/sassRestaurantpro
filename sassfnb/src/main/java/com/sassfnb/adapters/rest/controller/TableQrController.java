// src/main/java/com/sassfnb/adapters/rest/controller/TableQrController.java
package com.sassfnb.adapters.rest.controller;

import com.sassfnb.adapters.rest.dto.tenant.TableDtos.*;
import com.sassfnb.application.service.TableService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class TableQrController {

    private final TableService service;

    // GET /tables/{id}/qr
    @GetMapping("/tables/{id}/qr")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','STAFF')")
    public TableQrResponse current(@PathVariable UUID id) {
        return service.currentQr(id);
    }

    // POST /tables/{id}/qr/rotate
    @PostMapping("/tables/{id}/qr/rotate")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN')")
    public TableQrResponse rotate(@PathVariable UUID id, @RequestBody(required = false) TableQrRotateRequest req) {
        Integer ttl = (req == null) ? null : req.ttlMinutes();
        return service.rotateQr(id, ttl);
    }

    // POST /tables/{id}/qr/disable
    @PostMapping("/tables/{id}/qr/disable")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN')")
    public void disable(@PathVariable UUID id) {
        service.disableQr(id);
    }

    // GET /qr/resolve?token=
    // @GetMapping("/qr/resolve")
    // @PreAuthorize("permitAll()")
    // public TableResolveResponse resolve(@RequestParam String token) {
    // return service.resolve(token);
    // }
}
