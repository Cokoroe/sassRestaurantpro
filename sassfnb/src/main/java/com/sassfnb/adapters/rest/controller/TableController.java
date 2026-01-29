// src/main/java/com/sassfnb/adapters/rest/controller/TableController.java
package com.sassfnb.adapters.rest.controller;

import com.sassfnb.adapters.rest.dto.tenant.TableDtos.*;
import com.sassfnb.application.service.TableService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class TableController {

    private final TableService service;

    // GET /tables?outletId=&q=&status=&groupCode=&page=&size=
    @GetMapping("/tables")
    public Page<TableResponse> list(
            @RequestParam UUID outletId,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String groupCode,
            Pageable pageable) {
        return service.list(outletId, q, status, groupCode, pageable);
    }

    // POST /tables
    @PostMapping("/tables")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN')")
    public TableResponse create(@RequestBody TableCreateRequest req) {
        return service.create(req);
    }

    // GET /tables/{id}
    @GetMapping("/tables/{id}")
    public TableResponse get(@PathVariable UUID id) {
        return service.get(id);
    }

    // PUT /tables/{id}
    @PutMapping("/tables/{id}")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN')")
    public TableResponse update(@PathVariable UUID id, @RequestBody TableUpdateRequest req) {
        return service.update(id, req);
    }

    // PATCH /tables/{id}/status
    @PatchMapping("/tables/{id}/status")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN')")
    public void patchStatus(@PathVariable UUID id, @RequestBody TableStatusPatchRequest req) {
        service.patchStatus(id, req);
    }

    // DELETE /tables/{id}
    @DeleteMapping("/tables/{id}")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN')")
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }

    // -------- Bulk import (CSV/Excel) --------
    // Tùy bạn implement sau; ở đây đặt endpoint sẵn
    // @PostMapping(value="/tables/bulk/import", consumes =
    // MediaType.MULTIPART_FORM_DATA_VALUE)
    // public ImportJobResponse importTables(@RequestPart("file") MultipartFile
    // file) { ... }
}
