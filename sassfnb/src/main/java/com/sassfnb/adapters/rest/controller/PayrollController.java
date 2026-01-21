package com.sassfnb.adapters.rest.controller;

import com.sassfnb.adapters.rest.dto.payroll.PayrollDtos.*;
import com.sassfnb.application.service.PayrollService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payroll")
@RequiredArgsConstructor
public class PayrollController {

    private final PayrollService payrollService;

    // ===== Pay rates =====
    @GetMapping("/pay-rates")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER')")
    public List<PayRateResponse> listRates(
            @RequestParam UUID outletId,
            @RequestParam(required = false) UUID staffId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate at) {
        return payrollService.listRates(outletId, staffId, at);
    }

    @PostMapping("/pay-rates")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER')")
    public PayRateResponse createRate(@RequestBody PayRateUpsertRequest req) {
        return payrollService.createRate(req);
    }

    @PutMapping("/pay-rates/{id}")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER')")
    public PayRateResponse updateRate(@PathVariable UUID id, @RequestBody PayRateUpsertRequest req) {
        return payrollService.updateRate(id, req);
    }

    // ===== Payroll periods =====
    @PostMapping("/periods")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER')")
    public PayrollPeriodResponse createPeriod(@RequestBody PayrollPeriodCreateRequest req) {
        return payrollService.createPeriod(req);
    }

    @GetMapping("/periods")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER')")
    public List<PayrollPeriodResponse> listPeriods(@RequestParam UUID outletId) {
        return payrollService.listPeriods(outletId);
    }

    @PostMapping("/periods/{id}/close")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN')")
    public PayrollPeriodResponse closePeriod(@PathVariable UUID id) {
        return payrollService.closePeriod(id);
    }

    // ===== Calculate =====
    @PostMapping("/periods/{id}/calculate")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER')")
    public PayrollPeriodDetailsResponse calculate(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "true") boolean replaceExisting) {
        return payrollService.calculate(id, replaceExisting);
    }

    @GetMapping("/periods/{id}/details")
    @PreAuthorize("hasAnyAuthority('ROOT','OWNER','ADMIN','MANAGER')")
    public PayrollPeriodDetailsResponse details(@PathVariable UUID id) {
        return payrollService.getPeriodDetails(id);
    }
}
