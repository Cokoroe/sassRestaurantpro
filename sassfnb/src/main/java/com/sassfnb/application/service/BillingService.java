package com.sassfnb.application.service;

import com.sassfnb.adapters.rest.dto.billing.BillingDtos.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface BillingService {
    BillingTotalsResponse getTotals(BillingScope scope, UUID orderId, UUID groupId);

    // ✅ NEW
    BillingGroupPrepareResponse prepareGroup(UUID outletId);

    UUID createGroup(CreateGroupRequest request);

    Page<BillingGroupSummary> listGroups(UUID outletId, String status, String q, Pageable pageable);

    BillingGroupDetailResponse getGroup(UUID groupId);

    void updateGroup(UUID groupId, UpdateGroupRequest request);

    void deleteGroup(UUID groupId);
}
