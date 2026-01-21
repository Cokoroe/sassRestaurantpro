package com.sassfnb.adapters.persistence.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Objects;
import java.util.UUID;

@Repository
public class BillingCalcRepository {

  @PersistenceContext
  private EntityManager em;

  public record OrderAgg(BigDecimal subTotal, BigDecimal discountTotal) {
  }

  public record GroupAgg(BigDecimal subTotal, BigDecimal discountTotal) {
  }

  // =========================
  // ORDER aggregates
  // =========================
  public OrderAgg calcOrderAgg(UUID tenantId, UUID orderId) {
    String sql = """
            SELECT
              COALESCE(SUM(oi.unit_price * oi.quantity), 0) AS sub_total,
              COALESCE(SUM(COALESCE(oi.discount_amount, 0)), 0) AS discount_total
            FROM order_items oi
            WHERE oi.tenant_id = :tenantId
              AND oi.order_id  = :orderId
              AND UPPER(oi.status) <> 'VOIDED'
        """;

    Object[] row = (Object[]) em.createNativeQuery(sql)
        .setParameter("tenantId", tenantId)
        .setParameter("orderId", orderId)
        .getSingleResult();

    return new OrderAgg(toBd(row[0]), toBd(row[1]));
  }

  public BigDecimal sumPaidByOrder(UUID tenantId, UUID orderId) {
    String sql = """
            SELECT COALESCE(SUM(p.amount), 0)
            FROM payments p
            WHERE p.tenant_id = :tenantId
              AND p.order_id  = :orderId
              AND UPPER(p.status) = 'CONFIRMED'
        """;

    Object val = em.createNativeQuery(sql)
        .setParameter("tenantId", tenantId)
        .setParameter("orderId", orderId)
        .getSingleResult();

    return toBd(val);
  }

  // =========================
  // GROUP aggregates
  // =========================
  public GroupAgg calcGroupAgg(UUID tenantId, UUID groupId) {
    String sql = """
            SELECT
              COALESCE(SUM(oi.unit_price * oi.quantity), 0) AS sub_total,
              COALESCE(SUM(COALESCE(oi.discount_amount, 0)), 0) AS discount_total
            FROM billing_group_orders bgo
            JOIN order_items oi ON oi.order_id = bgo.order_id
            WHERE bgo.tenant_id = :tenantId
              AND bgo.group_id  = :groupId
              AND oi.tenant_id  = :tenantId
              AND UPPER(oi.status) <> 'VOIDED'
        """;

    Object[] row = (Object[]) em.createNativeQuery(sql)
        .setParameter("tenantId", tenantId)
        .setParameter("groupId", groupId)
        .getSingleResult();

    return new GroupAgg(toBd(row[0]), toBd(row[1]));
  }

  public BigDecimal sumPaidByGroup(UUID tenantId, UUID groupId) {
    String sql = """
            SELECT COALESCE(SUM(p.amount), 0)
            FROM payments p
            WHERE p.tenant_id = :tenantId
              AND p.group_id  = :groupId
              AND UPPER(p.status) = 'CONFIRMED'
        """;

    Object val = em.createNativeQuery(sql)
        .setParameter("tenantId", tenantId)
        .setParameter("groupId", groupId)
        .getSingleResult();

    return toBd(val);
  }

  // =========================
  // Helpers
  // =========================
  private BigDecimal toBd(Object v) {
    if (v == null)
      return BigDecimal.ZERO;
    if (v instanceof BigDecimal bd)
      return bd;
    if (v instanceof Number n)
      return BigDecimal.valueOf(n.doubleValue());
    return new BigDecimal(Objects.toString(v));
  }

  public record OrderDiscountAgg(String type, BigDecimal value) {
  }

  public OrderDiscountAgg getOrderDiscount(UUID tenantId, UUID orderId) {
    String sql = """
            SELECT od.type, od.value
            FROM order_discounts od
            WHERE od.tenant_id = :tenantId
              AND od.order_id  = :orderId
            LIMIT 1
        """;

    var list = em.createNativeQuery(sql)
        .setParameter("tenantId", tenantId)
        .setParameter("orderId", orderId)
        .getResultList();

    if (list == null || list.isEmpty()) {
      return new OrderDiscountAgg(null, BigDecimal.ZERO);
    }
    Object[] row = (Object[]) list.get(0);
    String type = row[0] == null ? null : row[0].toString();
    BigDecimal val = toBd(row[1]);
    return new OrderDiscountAgg(type, val);
  }

  public BigDecimal calcOrderDiscountAmount(UUID tenantId, UUID orderId, BigDecimal subTotalMinusItemDiscount) {
    OrderDiscountAgg d = getOrderDiscount(tenantId, orderId);
    if (d.type() == null || d.value() == null)
      return BigDecimal.ZERO;

    String t = d.type().toUpperCase(java.util.Locale.ROOT);
    if ("AMOUNT".equals(t)) {
      return d.value().max(BigDecimal.ZERO);
    }
    if ("PERCENT".equals(t)) {
      BigDecimal pct = d.value().max(BigDecimal.ZERO);
      BigDecimal amount = subTotalMinusItemDiscount.multiply(pct).divide(new BigDecimal("100"));
      return amount.max(BigDecimal.ZERO);
    }
    return BigDecimal.ZERO;
  }

}
