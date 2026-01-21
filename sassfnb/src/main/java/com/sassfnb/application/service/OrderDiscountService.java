package com.sassfnb.application.service;

import com.sassfnb.adapters.rest.dto.billing.DiscountDtos.*;

import java.util.UUID;

public interface OrderDiscountService {
    DiscountResponse apply(UUID orderId, ApplyDiscountRequest request);

    void remove(UUID orderId);
}
