package com.sassfnb.application.service.impl;

import com.sassfnb.adapters.persistence.entity.BillingGroupOrderEntity;
import com.sassfnb.adapters.persistence.entity.PaymentEntity;
import com.sassfnb.adapters.persistence.repository.BillingCalcRepository;
import com.sassfnb.adapters.persistence.repository.BillingGroupOrderRepository;
import com.sassfnb.adapters.persistence.repository.BillingGroupRepository;
import com.sassfnb.adapters.persistence.repository.OrderRepository;
import com.sassfnb.adapters.persistence.repository.PaymentRepository;
import com.sassfnb.adapters.persistence.repository.SettingsRepository;
import com.sassfnb.adapters.rest.dto.billing.BillingDtos.BillingScope;
import com.sassfnb.adapters.rest.dto.billing.PaymentDtos.ManualPaymentRequest;
import com.sassfnb.adapters.rest.dto.billing.PaymentDtos.ManualPaymentResponse;
import com.sassfnb.adapters.rest.dto.billing.PaymentDtos.SepayInitResponse;
import com.sassfnb.application.exception.BadRequestException;
import com.sassfnb.application.exception.NotFoundException;
import com.sassfnb.application.ports.TenantResolver;
import com.sassfnb.application.service.BillingPaymentService;
import com.sassfnb.application.service.BillingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BillingPaymentServiceImpl implements BillingPaymentService {

    private static final String SCOPE_ORDER = "ORDER";
    private static final String SCOPE_GROUP = "GROUP";

    private static final String STATUS_CONFIRMED = "CONFIRMED";
    private static final String STATUS_PENDING = "PENDING";

    private static final String METHOD_CASH = "CASH";
    private static final String METHOD_TRANSFER = "TRANSFER";
    private static final String METHOD_SEPAY = "SEPAY";

    // settings keys
    private static final String KEY_SEPAY_ACC = "SEPAY_ACC";
    private static final String KEY_SEPAY_BANK = "SEPAY_BANK";

    private final TenantResolver tenantResolver;

    private final OrderRepository orderRepository;
    private final BillingGroupRepository billingGroupRepository;
    private final BillingGroupOrderRepository billingGroupOrderRepository;

    private final PaymentRepository paymentRepository;
    private final BillingCalcRepository billingCalcRepository;
    private final SettingsRepository settingsRepository;

    private final BillingService billingService;

    // =========================
    // 3) MANUAL PAYMENTS
    // =========================

    @Override
    @Transactional
    public ManualPaymentResponse manualPayOrder(UUID orderId, ManualPaymentRequest request) {
        UUID tenantId = tenantResolver.currentTenantId();
        UUID outletId = tenantResolver.currentOutletId();
        UUID staffId = tenantResolver.currentUserId();

        validateManualRequest(request);

        var order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));

        if (!tenantId.equals(order.getTenantId())) {
            throw new BadRequestException("Order does not belong to current tenant");
        }
        if (!outletId.equals(order.getOutletId())) {
            throw new BadRequestException("Order does not belong to current outlet");
        }

        var totals = billingService.getTotals(BillingScope.ORDER, orderId, null);

        BigDecimal due = nvl(totals.dueTotal());
        if (due.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Nothing to pay. dueTotal=" + due);
        }

        BigDecimal amount = nvl(request.amount());
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("amount must be > 0");
        }
        if (amount.compareTo(due) > 0) {
            throw new BadRequestException("amount cannot exceed dueTotal. dueTotal=" + due);
        }

        PaymentEntity p = new PaymentEntity();
        p.setTenantId(tenantId);
        p.setOutletId(outletId);
        p.setScope(SCOPE_ORDER);

        // IMPORTANT: enforce correct ref for scope
        p.setOrderId(orderId);
        p.setGroupId(null);

        p.setMethod(request.method().toUpperCase(Locale.ROOT));
        p.setStatus(STATUS_CONFIRMED);
        p.setAmount(amount);
        p.setNote(request.note());
        p.setStaffId(staffId);
        p.setReceivedAt(request.receivedAt() != null ? request.receivedAt() : Instant.now());

        paymentRepository.save(p);

        BigDecimal paidTotal = nvl(billingCalcRepository.sumPaidByOrder(tenantId, orderId));
        BigDecimal grandTotal = nvl(totals.grandTotal());

        BigDecimal dueTotal = grandTotal.subtract(paidTotal);
        if (dueTotal.compareTo(BigDecimal.ZERO) < 0)
            dueTotal = BigDecimal.ZERO;

        return new ManualPaymentResponse(p.getId(), paidTotal, dueTotal);
    }

    /**
     * ✅ FIX: Manual pay GROUP phải phân bổ tiền xuống từng ORDER trong group
     * để closeGroup() không bị fail do "Order in group not fully paid".
     *
     * Rule:
     * - amount <= group due
     * - phân bổ theo thứ tự orders trong group (ổn cho MVP)
     * - mỗi payment record: scope=GROUP, group_id=..., order_id=... (KHÔNG null)
     */
    @Override
    @Transactional
    public ManualPaymentResponse manualPayGroup(UUID groupId, ManualPaymentRequest request) {
        UUID tenantId = tenantResolver.currentTenantId();
        UUID outletId = tenantResolver.currentOutletId();
        UUID staffId = tenantResolver.currentUserId();

        validateManualRequest(request);

        var group = billingGroupRepository.findByIdAndTenantId(groupId, tenantId)
                .orElseThrow(() -> new NotFoundException("Billing group not found: " + groupId));

        if (!outletId.equals(group.getOutletId())) {
            throw new BadRequestException("Group does not belong to current outlet");
        }

        var groupTotals = billingService.getTotals(BillingScope.GROUP, null, groupId);
        BigDecimal groupDue = nvl(groupTotals.dueTotal());
        if (groupDue.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Nothing to pay. dueTotal=" + groupDue);
        }

        BigDecimal amount = nvl(request.amount());
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("amount must be > 0");
        }
        if (amount.compareTo(groupDue) > 0) {
            throw new BadRequestException("amount cannot exceed dueTotal. dueTotal=" + groupDue);
        }

        List<UUID> orderIds = billingGroupOrderRepository.findByTenantIdAndGroupId(tenantId, groupId)
                .stream()
                .map(BillingGroupOrderEntity::getOrderId)
                .toList();

        if (orderIds.isEmpty()) {
            throw new BadRequestException("Group has no orders to allocate payment");
        }

        BigDecimal remain = amount;
        UUID lastPaymentId = null;

        for (UUID orderId : orderIds) {
            if (remain.compareTo(BigDecimal.ZERO) <= 0)
                break;

            var ot = billingService.getTotals(BillingScope.ORDER, orderId, null);
            BigDecimal orderDue = nvl(ot.dueTotal());
            if (orderDue.compareTo(BigDecimal.ZERO) <= 0)
                continue;

            BigDecimal pay = remain.min(orderDue);
            if (pay.compareTo(BigDecimal.ZERO) <= 0)
                continue;

            PaymentEntity p = new PaymentEntity();
            p.setTenantId(tenantId);
            p.setOutletId(outletId);

            // scope=GROUP nhưng MUST có orderId để calc paid by order hoạt động
            p.setScope(SCOPE_GROUP);
            p.setGroupId(groupId);
            p.setOrderId(orderId);

            p.setMethod(request.method().toUpperCase(Locale.ROOT));
            p.setStatus(STATUS_CONFIRMED);
            p.setAmount(pay);
            p.setNote(request.note());
            p.setStaffId(staffId);
            p.setReceivedAt(request.receivedAt() != null ? request.receivedAt() : Instant.now());

            paymentRepository.save(p);
            lastPaymentId = p.getId();

            remain = remain.subtract(pay);
        }

        // Sau khi allocate -> trả totals của GROUP (paid/due theo group)
        BigDecimal paidTotal = nvl(billingCalcRepository.sumPaidByGroup(tenantId, groupId));
        BigDecimal grandTotal = nvl(groupTotals.grandTotal());

        BigDecimal dueTotal = grandTotal.subtract(paidTotal);
        if (dueTotal.compareTo(BigDecimal.ZERO) < 0)
            dueTotal = BigDecimal.ZERO;

        return new ManualPaymentResponse(lastPaymentId, paidTotal, dueTotal);
    }

    private void validateManualRequest(ManualPaymentRequest request) {
        if (request == null)
            throw new BadRequestException("Body is required");
        if (request.method() == null || request.method().isBlank())
            throw new BadRequestException("method is required");
        if (request.amount() == null)
            throw new BadRequestException("amount is required");

        String m = request.method().toUpperCase(Locale.ROOT);
        if (!METHOD_CASH.equals(m) && !METHOD_TRANSFER.equals(m)) {
            throw new BadRequestException("method must be CASH or TRANSFER");
        }
    }

    // =========================
    // 4) SEPAY INIT
    // =========================

    @Override
    @Transactional
    public SepayInitResponse initSepayForOrder(UUID orderId) {
        UUID tenantId = tenantResolver.currentTenantId();
        UUID outletId = tenantResolver.currentOutletId();
        UUID staffId = tenantResolver.currentUserId();

        var order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));

        if (!tenantId.equals(order.getTenantId())) {
            throw new BadRequestException("Order does not belong to current tenant");
        }
        if (!outletId.equals(order.getOutletId())) {
            throw new BadRequestException("Order does not belong to current outlet");
        }

        var totals = billingService.getTotals(BillingScope.ORDER, orderId, null);
        BigDecimal due = nvl(totals.dueTotal());
        if (due.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Nothing to pay. dueTotal=" + due);
        }

        String paymentCode = generatePaymentCode();
        String qrUrl = buildSepayQrUrl(tenantId, outletId, due, paymentCode);

        PaymentEntity p = new PaymentEntity();
        p.setTenantId(tenantId);
        p.setOutletId(outletId);
        p.setScope(SCOPE_ORDER);

        p.setOrderId(orderId);
        p.setGroupId(null);

        p.setMethod(METHOD_SEPAY);
        p.setStatus(STATUS_PENDING);
        p.setAmount(due);
        p.setPaymentCode(paymentCode);
        p.setNote("SePay init");
        p.setStaffId(staffId);
        p.setReceivedAt(Instant.now());

        paymentRepository.save(p);

        return new SepayInitResponse(p.getId(), paymentCode, p.getAmount(), qrUrl, null);
    }

    @Override
    @Transactional
    public SepayInitResponse initSepayForGroup(UUID groupId) {
        UUID tenantId = tenantResolver.currentTenantId();
        UUID outletId = tenantResolver.currentOutletId();
        UUID staffId = tenantResolver.currentUserId();

        var group = billingGroupRepository.findByIdAndTenantId(groupId, tenantId)
                .orElseThrow(() -> new NotFoundException("Billing group not found: " + groupId));

        if (!outletId.equals(group.getOutletId())) {
            throw new BadRequestException("Group does not belong to current outlet");
        }

        var totals = billingService.getTotals(BillingScope.GROUP, null, groupId);
        BigDecimal due = nvl(totals.dueTotal());
        if (due.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Nothing to pay. dueTotal=" + due);
        }

        String paymentCode = generatePaymentCode();
        String qrUrl = buildSepayQrUrl(tenantId, outletId, due, paymentCode);

        PaymentEntity p = new PaymentEntity();
        p.setTenantId(tenantId);
        p.setOutletId(outletId);
        p.setScope(SCOPE_GROUP);

        // NOTE: SePay group vẫn để framework (chưa confirm/allocate chính thức)
        p.setGroupId(groupId);
        p.setOrderId(null);

        p.setMethod(METHOD_SEPAY);
        p.setStatus(STATUS_PENDING);
        p.setAmount(due);
        p.setPaymentCode(paymentCode);
        p.setNote("SePay init");
        p.setStaffId(staffId);
        p.setReceivedAt(Instant.now());

        paymentRepository.save(p);

        return new SepayInitResponse(p.getId(), paymentCode, p.getAmount(), qrUrl, null);
    }

    // =========================
    // Helpers
    // =========================

    private String buildSepayQrUrl(UUID tenantId, UUID outletId, BigDecimal amount, String paymentCode) {
        String acc = getRequiredSetting(tenantId, outletId, KEY_SEPAY_ACC);
        String bank = getRequiredSetting(tenantId, outletId, KEY_SEPAY_BANK);

        String des = URLEncoder.encode(paymentCode, StandardCharsets.UTF_8);
        String amt = nvl(amount).setScale(0, RoundingMode.HALF_UP).toPlainString();

        return "https://qr.sepay.vn/img?acc=" + acc
                + "&bank=" + bank
                + "&amount=" + amt
                + "&des=" + des;
    }

    private String getRequiredSetting(UUID tenantId, UUID outletId, String key) {
        return settingsRepository.findByTenantIdAndOutletIdAndKey(tenantId, outletId, key)
                .map(s -> s.getValue())
                .filter(v -> v != null && !v.isBlank())
                .orElseThrow(() -> new BadRequestException("Missing setting: " + key + " (tenant/outlet)"));
    }

    private String generatePaymentCode() {
        String s = UUID.randomUUID().toString().replace("-", "")
                .substring(0, 6).toUpperCase(Locale.ROOT);
        return "DH" + s;
    }

    private BigDecimal nvl(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }
}
