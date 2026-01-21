package com.sassfnb.adapters.rest.controller;

import com.sassfnb.adapters.rest.dto.billing.BillingDtos.*;
import com.sassfnb.application.service.BillingService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/billing")
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;

    @GetMapping("/totals")
    public BillingTotalsResponse getTotals(
            @RequestParam BillingScope scope,
            @RequestParam(required = false) UUID orderId,
            @RequestParam(required = false) UUID groupId) {
        return billingService.getTotals(scope, orderId, groupId);
    }

    // ✅ NEW: helper để FE chọn bàn và BE trả về order active theo bàn
    // GET /api/v1/billing/groups/prepare?outletId=...
    @GetMapping("/groups/prepare")
    public BillingGroupPrepareResponse prepareGroup(
            @RequestParam(required = false) UUID outletId) {
        return billingService.prepareGroup(outletId);
    }

    @PostMapping("/groups")
    public UUID createGroup(@RequestBody CreateGroupRequest request) {
        return billingService.createGroup(request);
    }

    @GetMapping("/groups")
    public Page<BillingGroupSummary> listGroups(
            @RequestParam(required = false) UUID outletId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return billingService.listGroups(outletId, status, q, PageRequest.of(page, size));
    }

    @GetMapping("/groups/{groupId}")
    public BillingGroupDetailResponse getGroup(@PathVariable UUID groupId) {
        return billingService.getGroup(groupId);
    }

    @PatchMapping("/groups/{groupId}")
    public void updateGroup(@PathVariable UUID groupId, @RequestBody UpdateGroupRequest request) {
        billingService.updateGroup(groupId, request);
    }

    @DeleteMapping("/groups/{groupId}")
    public void deleteGroup(@PathVariable UUID groupId) {
        billingService.deleteGroup(groupId);
    }
}
