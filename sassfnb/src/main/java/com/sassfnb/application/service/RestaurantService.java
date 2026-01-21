// src/main/java/com/sassfnb/application/service/RestaurantService.java
package com.sassfnb.application.service;

import com.sassfnb.adapters.rest.dto.tenant.RestaurantDtos.RestaurantCreateRequest;
import com.sassfnb.adapters.rest.dto.tenant.RestaurantDtos.RestaurantResponse;
import com.sassfnb.adapters.rest.dto.tenant.RestaurantDtos.RestaurantStatusPatchRequest;
import com.sassfnb.adapters.rest.dto.tenant.RestaurantDtos.RestaurantUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface RestaurantService {
    RestaurantResponse getMyRestaurant();

    RestaurantResponse updateMyRestaurant(RestaurantUpdateRequest req);

    Page<RestaurantResponse> listOwnedRestaurants(String q, String status, Pageable pageable);

    RestaurantResponse createRestaurant(RestaurantCreateRequest req);

    RestaurantResponse getRestaurant(UUID id);

    void patchRestaurantStatus(UUID id, RestaurantStatusPatchRequest req);

    RestaurantResponse updateRestaurant(UUID id, RestaurantUpdateRequest req);

}
