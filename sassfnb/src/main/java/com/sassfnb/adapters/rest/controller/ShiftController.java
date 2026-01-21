// src/main/java/com/sassfnb/adapters/rest/controller/ShiftController.java
package com.sassfnb.adapters.rest.controller;

import com.sassfnb.adapters.rest.dto.shift.ShiftDtos.*;
import com.sassfnb.application.service.ShiftService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/shifts")
@RequiredArgsConstructor
public class ShiftController {

    private final ShiftService shiftService;

    // ========= TEMPLATE (OWNER/MANAGER) ==========
    @GetMapping("/templates")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER')")
    public List<ShiftTemplateResponse> listTemplates(@RequestParam(required = false) UUID outletId) {
        return shiftService.listTemplates(outletId);
    }

    @PostMapping("/templates")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER')")
    public ShiftTemplateResponse createTemplate(@RequestBody ShiftTemplateRequest req) {
        return shiftService.createTemplate(req);
    }

    @PatchMapping("/templates/{templateId}")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER')")
    public ShiftTemplateResponse updateTemplate(
            @PathVariable UUID templateId,
            @RequestBody ShiftTemplateUpdateRequest req) {
        return shiftService.updateTemplate(templateId, req);
    }

    @DeleteMapping("/templates/{templateId}")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER')")
    public void deleteTemplate(@PathVariable UUID templateId) {
        shiftService.deleteTemplate(templateId);
    }

    // ========= SCHEDULE (OWNER/MANAGER) ==========
    @PostMapping("/schedule")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER')")
    public List<ShiftAssignmentResponse> schedule(@RequestBody ShiftScheduleRequest req) {
        return shiftService.schedule(req);
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER')")
    public List<ShiftAssignmentResponse> search(
            @RequestParam(required = false) UUID outletId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) UUID staffId,
            @RequestParam(required = false) String status) {
        return shiftService.search(outletId, dateFrom, dateTo, staffId, status);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER')")
    public ShiftAssignmentResponse update(
            @PathVariable UUID id,
            @RequestBody ShiftUpdateRequest req) {
        return shiftService.update(id, req);
    }

    /** Chốt ca / mở lại ca: áp dụng cho assignment */
    @PatchMapping("/{shiftId}/status")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER')")
    public void updateShiftStatus(
            @PathVariable UUID shiftId,
            @RequestBody ShiftStatusUpdateRequest req) {
        shiftService.updateShiftStatus(shiftId, req.getStatus());
    }

    // ========= MY SHIFTS (STAFF) ==========
    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public List<ShiftAssignmentResponse> myShifts(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) String status) {
        MyShiftSearchCriteria c = new MyShiftSearchCriteria();
        c.setDateFrom(dateFrom);
        c.setDateTo(dateTo);
        c.setStatus(status);
        return shiftService.myShifts(c);
    }
}
