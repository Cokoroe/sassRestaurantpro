// src/main/java/com/sassfnb/application/service/MenuPriceService.java
package com.sassfnb.application.service;

import com.sassfnb.adapters.rest.dto.menu.MenuDtos.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface MenuPriceService {
    List<PriceResponse> listPrices(UUID itemId, UUID outletId);

    PriceResponse createPrice(UUID itemId, PriceCreateRequest req);

    PriceResponse updatePrice(UUID itemId, UUID priceId, PriceUpdateRequest req);

    PriceResponse activatePrice(UUID itemId, UUID priceId, PriceActivatePatchRequest req);

    void deletePrice(UUID itemId, UUID priceId);

    PriceResponse getEffectivePrice(UUID itemId, UUID outletId, Instant at);
}
