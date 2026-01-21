package com.sassfnb.application.service;

import com.sassfnb.adapters.rest.dto.order.OrderDtos.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface OrderWorkflowService {

    // ===== Staff/POS (auth + tenant context) =====
    SubmitOrderResponse submit(UUID orderId);

    ReopenOrderResponse reopen(UUID orderId, ReopenOrderRequest req);

    Page<OrderResponse> staffList(StaffOrderListRequest req, Pageable pageable);

    OrderResponse staffGet(UUID orderId);

    OrderResponse fire(UUID orderId, FireOrderRequest req);

    OrderResponse voidItem(UUID orderId, UUID itemId, VoidItemRequest req);

    OrderResponse voidOrder(UUID orderId, VoidOrderRequest req);

    OrderResponse patchNote(UUID orderId, PatchOrderNoteRequest req);

    // ===== Public (NO tenant header/token) =====
    SubmitOrderResponse submitPublic(UUID orderId, UUID outletId);

    ReopenOrderResponse reopenPublic(UUID orderId, UUID outletId, ReopenOrderRequest req);

    // ===== Part 7 =====
    OrderTotalsResponse totals(UUID orderId);

    CloseOrderResponse close(UUID orderId, CloseOrderRequest req);
}
