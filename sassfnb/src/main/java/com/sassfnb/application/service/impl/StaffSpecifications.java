package com.sassfnb.application.service.impl;

import com.sassfnb.adapters.persistence.entity.StaffEntity;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class StaffSpecifications {

    private StaffSpecifications() {
    }

    public static Specification<StaffEntity> build(
            UUID tenantId,
            UUID restaurantId,
            UUID outletId,
            String q,
            String status) {
        return (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();

            // tenant mandatory
            ps.add(cb.equal(root.get("tenantId"), tenantId));

            if (restaurantId != null) {
                ps.add(cb.equal(root.get("restaurantId"), restaurantId));
            }
            if (outletId != null) {
                ps.add(cb.equal(root.get("outletId"), outletId));
            }
            if (status != null && !status.isBlank()) {
                ps.add(cb.equal(root.get("status"), status));
            }

            if (q != null && !q.isBlank()) {
                String like = "%" + q.trim().toLowerCase() + "%";
                ps.add(cb.or(
                        cb.like(cb.lower(root.get("code")), like),
                        cb.like(cb.lower(root.get("position")), like)));
            }

            return cb.and(ps.toArray(new Predicate[0]));
        };
    }
}
