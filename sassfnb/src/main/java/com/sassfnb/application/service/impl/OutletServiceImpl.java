package com.sassfnb.application.service.impl;

import com.sassfnb.adapters.persistence.entity.OutletEntity;
import com.sassfnb.adapters.persistence.repository.OutletRepository;
import com.sassfnb.adapters.rest.dto.tenant.OutletDtos.OutletCreateRequest;
import com.sassfnb.adapters.rest.dto.tenant.OutletDtos.OutletHoursUpdateRequest;
import com.sassfnb.adapters.rest.dto.tenant.OutletDtos.OutletResponse;
import com.sassfnb.adapters.rest.dto.tenant.OutletDtos.OutletUpdateRequest;
import com.sassfnb.application.ports.TenantResolver;
import com.sassfnb.application.service.OutletService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OutletServiceImpl implements OutletService {

    private final OutletRepository repo;
    private final TenantResolver tenant;

    // ============================================================
    // Mapping
    // ============================================================
    private OutletResponse map(OutletEntity e) {
        return new OutletResponse(
                e.getId(),
                e.getName(),
                e.getCode(),
                e.getPhone(),
                e.getAddress(),
                e.getCity(),
                e.getCountry(),
                e.getTimezone(),
                e.getOpenHoursJson(),
                e.isDefault(),
                e.getStatus(),
                e.getCreatedAt(),
                e.getUpdatedAt());
    }

    // ============================================================
    // LIST OUTLETS
    // ============================================================
    @Override
    public Page<OutletResponse> listOutlets(
            UUID restaurantId, // <--- thêm
            String q,
            String city,
            Boolean isDefault,
            Pageable pageable) {
        // Nếu FE gửi restaurantId thì dùng, còn không thì lấy theo context hiện tại
        UUID rid = (restaurantId != null)
                ? restaurantId
                : tenant.currentRestaurantId();

        if (q == null)
            q = "";
        if (city == null)
            city = "";

        Page<OutletEntity> p = repo.findByRestaurantIdAndCityContainingIgnoreCaseAndNameContainingIgnoreCase(
                rid, city, q, pageable);

        if (isDefault != null) {
            p = new PageImpl<>(
                    p.getContent().stream()
                            .filter(o -> o.isDefault() == isDefault)
                            .toList(),
                    pageable,
                    p.getTotalElements());
        }

        return p.map(this::map);
    }

    // ============================================================
    // CREATE
    // ============================================================
    @Override
    @Transactional
    public OutletResponse createOutlet(OutletCreateRequest req) {
        // Nếu không truyền restaurantId thì lấy từ context hiện tại
        UUID restaurantId = req.restaurantId() != null
                ? req.restaurantId()
                : tenant.currentRestaurantId();

        OutletEntity e = OutletEntity.builder()
                // KHÔNG set id, để @GeneratedValue lo
                .restaurantId(restaurantId)
                .name(req.name())
                .code(req.code())
                .phone(req.phone())
                .address(req.address())
                .city(req.city())
                .country(req.country())
                .timezone(req.timezone())
                .openHours(req.openHours())
                .defaultOutlet(Boolean.TRUE.equals(req.isDefault()))
                .status("ACTIVE")
                // createdAt / updatedAt đã có @CreationTimestamp / @UpdateTimestamp
                .build();

        if (e.isDefault()) {
            clearDefault(restaurantId);
        }

        OutletEntity saved = repo.save(e);
        return map(saved);
    }

    // Clear default
    private void clearDefault(UUID restaurantId) {
        repo.findByRestaurantId(restaurantId, Pageable.unpaged())
                .forEach(o -> {
                    if (o.isDefault()) {
                        o.setDefault(false);
                    }
                });
        // Không cần saveAll, vì các entity này đang được quản lý trong cùng transaction
    }

    // ============================================================
    // GET
    // ============================================================
    @Override
    public OutletResponse getOutlet(UUID id) {
        return repo.findById(id).map(this::map).orElseThrow();
    }

    // ============================================================
    // UPDATE
    // ============================================================
    @Override
    @Transactional
    public OutletResponse updateOutlet(UUID id, OutletUpdateRequest req) {
        OutletEntity e = repo.findById(id).orElseThrow();

        if (req.name() != null)
            e.setName(req.name());
        if (req.code() != null)
            e.setCode(req.code());
        if (req.phone() != null)
            e.setPhone(req.phone());
        if (req.address() != null)
            e.setAddress(req.address());
        if (req.city() != null)
            e.setCity(req.city());
        if (req.country() != null)
            e.setCountry(req.country());
        if (req.timezone() != null)
            e.setTimezone(req.timezone());
        if (req.openHours() != null)
            e.setOpenHoursJson(req.openHours());
        if (req.status() != null)
            e.setStatus(req.status());

        if (Boolean.TRUE.equals(req.isDefault())) {
            clearDefault(e.getRestaurantId());
            e.setDefault(true);
        }

        e.setUpdatedAt(Instant.now());
        return map(e);
    }

    // ============================================================
    // ARCHIVE
    // ============================================================
    @Override
    @Transactional
    public void deleteOutlet(UUID id) {
        OutletEntity e = repo.findById(id).orElseThrow();
        e.setStatus("ARCHIVED");
        e.setUpdatedAt(Instant.now());
    }

    // ============================================================
    // MAKE DEFAULT
    // ============================================================
    @Override
    @Transactional
    public void makeDefault(UUID id) {
        OutletEntity e = repo.findById(id).orElseThrow();
        clearDefault(e.getRestaurantId());
        e.setDefault(true);
        e.setUpdatedAt(Instant.now());
    }

    // ============================================================
    // HOURS
    // ============================================================
    @Override
    public String getHours(UUID id) {
        return repo.findById(id)
                .map(OutletEntity::getOpenHoursJson)
                .orElse("");
    }

    @Override
    @Transactional
    public void updateHours(UUID id, OutletHoursUpdateRequest req) {
        OutletEntity e = repo.findById(id).orElseThrow();
        e.setOpenHoursJson(req.openHours());
        e.setUpdatedAt(Instant.now());
    }
}
