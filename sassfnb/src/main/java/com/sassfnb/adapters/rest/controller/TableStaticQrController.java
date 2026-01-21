// src/main/java/com/sassfnb/adapters/rest/controller/TableStaticQrController.java
package com.sassfnb.adapters.rest.controller;

import com.sassfnb.application.service.TableStaticQrAppService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','STAFF')")
public class TableStaticQrController {

    private final TableStaticQrAppService app;

    /**
     * Sinh QR tĩnh:
     * - Nếu chưa có code -> tạo code + upload Nuuls
     * - force=true -> tạo code mới (QR đã in sẽ hỏng, chỉ dùng khi thật cần)
     */
    @PostMapping("/tables/{id}/qr/static/generate")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN')")
    public TableStaticQrAppService.QrStaticDto generate(
            @PathVariable UUID id,
            @RequestParam(required = false) Integer size,
            @RequestParam(defaultValue = "false") boolean force) throws Exception {
        return app.generate(id, size, force);
    }

    // Lấy thông tin QR tĩnh hiện có
    @GetMapping("/tables/{id}/qr/static")
    public TableStaticQrAppService.QrStaticDto current(@PathVariable UUID id) {
        return app.current(id);
    }

    /**
     * Refresh ảnh QR tĩnh:
     * - GIỮ NGUYÊN code
     * - chỉ upload ảnh mới lên Nuuls và update url
     */
    @PutMapping("/tables/{id}/qr/static/refresh")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN')")
    public TableStaticQrAppService.QrStaticDto refresh(
            @PathVariable UUID id,
            @RequestParam(required = false) Integer size) throws Exception {
        return app.refreshImage(id, size);
    }
}
