// src/main/java/com/sassfnb/adapters/persistence/repository/impl/OrderRepositoryImpl.java
package com.sassfnb.adapters.persistence.repository.impl;

import com.sassfnb.adapters.persistence.entity.OrderEntity;
import com.sassfnb.adapters.persistence.repository.OrderRepositoryCustom;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
@RequiredArgsConstructor
public class OrderRepositoryImpl implements OrderRepositoryCustom {

    private final EntityManager em;

    @Override
    public Page<OrderEntity> search(UUID outletId, String status, UUID tableId, String q, Pageable pageable) {
        if (outletId == null)
            throw new IllegalArgumentException("outletId is required");

        StringBuilder jpql = new StringBuilder("select o from OrderEntity o where o.outletId = :outletId");
        StringBuilder count = new StringBuilder("select count(o) from OrderEntity o where o.outletId = :outletId");

        Map<String, Object> params = new HashMap<>();
        params.put("outletId", outletId);

        if (status != null && !status.isBlank()) {
            jpql.append(" and o.status = :status");
            count.append(" and o.status = :status");
            params.put("status", status);
        }
        if (tableId != null) {
            jpql.append(" and o.tableId = :tableId");
            count.append(" and o.tableId = :tableId");
            params.put("tableId", tableId);
        }
        if (q != null && !q.isBlank()) {
            // đơn giản: search theo UUID string của order
            jpql.append(" and cast(o.id as string) like :q");
            count.append(" and cast(o.id as string) like :q");
            params.put("q", "%" + q.trim() + "%");
        }

        jpql.append(" order by o.updatedAt desc");

        TypedQuery<OrderEntity> query = em.createQuery(jpql.toString(), OrderEntity.class);
        var countQuery = em.createQuery(count.toString(), Long.class);

        params.forEach((k, v) -> {
            query.setParameter(k, v);
            countQuery.setParameter(k, v);
        });

        query.setFirstResult((int) pageable.getOffset());
        query.setMaxResults(pageable.getPageSize());

        List<OrderEntity> content = query.getResultList();
        long total = countQuery.getSingleResult();

        return new PageImpl<>(content, pageable, total);
    }
}
