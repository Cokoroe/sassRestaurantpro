package com.sassfnb.application.service;

import com.sassfnb.adapters.rest.dto.publicorder.PublicOrderDtos.*;

import java.util.List;
import java.util.UUID;

public interface PublicOrderService {
    OrderResponse createOrder(CreateOrderRequest req);

    OrderResponse addItems(UUID orderId, List<AddItemRequest> items);

    OrderResponse patchItem(UUID orderId, UUID itemId, PatchItemRequest req);

    OrderResponse deleteItem(UUID orderId, UUID itemId);

    OrderResponse getOrder(UUID orderId);
}
