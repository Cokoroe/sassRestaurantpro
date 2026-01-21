package com.sassfnb.application.service;

import com.sassfnb.adapters.rest.dto.billing.CloseDtos.*;

import java.util.UUID;

public interface BillingCloseService {
    CloseResponse closeOrder(UUID orderId);

    CloseResponse closeGroup(UUID groupId);
}
