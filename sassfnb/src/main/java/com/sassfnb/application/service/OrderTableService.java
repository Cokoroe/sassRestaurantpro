// src/main/java/com/sassfnb/application/service/OrderTableService.java
package com.sassfnb.application.service;

import java.util.UUID;

public interface OrderTableService {

    /** Gán order vào table (idempotent) */
    void attach(UUID orderId, UUID tableId, UUID addedBy);

    /** Bỏ gán toàn bộ table khỏi order (khi close/void, tuỳ luồng) */
    void detachByOrder(UUID orderId);

    /** Lấy orderId gần nhất đang gán với table (phục vụ “resume order” nếu muốn) */
    UUID findLatestOrderIdByTable(UUID tableId);
}
