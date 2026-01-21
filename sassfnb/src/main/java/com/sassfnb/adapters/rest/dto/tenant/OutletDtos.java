package com.sassfnb.adapters.rest.dto.tenant;

import java.time.Instant;
import java.util.UUID;

public class OutletDtos {

        public record OutletResponse(
                        UUID id,
                        String name,
                        String code,
                        String phone,
                        String address,
                        String city,
                        String country,
                        String timezone,
                        String openHours,
                        boolean isDefault,
                        String status,
                        Instant createdAt,
                        Instant updatedAt) {
        }

        public record OutletCreateRequest(
                        UUID restaurantId,
                        String name,
                        String code,
                        String phone,
                        String address,
                        String city,
                        String country,
                        String timezone,
                        String openHours,
                        Boolean isDefault) {
        }

        public record OutletUpdateRequest(
                        String name,
                        String code,
                        String phone,
                        String address,
                        String city,
                        String country,
                        String timezone,
                        String openHours,
                        Boolean isDefault,
                        String status) {
        }

        public record OutletHoursUpdateRequest(String openHours) {
        }
}
