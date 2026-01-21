package com.sassfnb.application.service;

import com.sassfnb.adapters.rest.dto.publicmenu.PublicMenuDtos.PublicMenuTreeResponse;

import java.time.Instant;
import java.util.UUID;

public interface PublicMenuService {
    PublicMenuTreeResponse tree(UUID orderId, UUID outletId, Instant at);
}
