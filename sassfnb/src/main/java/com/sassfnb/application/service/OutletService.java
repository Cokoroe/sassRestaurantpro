// src/main/java/com/sassfnb/application/service/OutletService.java
package com.sassfnb.application.service;

import com.sassfnb.adapters.rest.dto.tenant.OutletDtos.OutletCreateRequest;
import com.sassfnb.adapters.rest.dto.tenant.OutletDtos.OutletHoursUpdateRequest;
import com.sassfnb.adapters.rest.dto.tenant.OutletDtos.OutletResponse;
import com.sassfnb.adapters.rest.dto.tenant.OutletDtos.OutletUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface OutletService {
    Page<OutletResponse> listOutlets(UUID restaurantId, String q, String city, Boolean isDefault, Pageable pageable);

    OutletResponse createOutlet(OutletCreateRequest req);

    OutletResponse getOutlet(UUID id);

    OutletResponse updateOutlet(UUID id, OutletUpdateRequest req);

    void deleteOutlet(UUID id);

    void makeDefault(UUID id);

    String getHours(UUID id);

    void updateHours(UUID id, OutletHoursUpdateRequest req);
}
