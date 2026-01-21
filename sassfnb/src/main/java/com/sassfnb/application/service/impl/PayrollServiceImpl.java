package com.sassfnb.application.service.impl;

import com.sassfnb.adapters.persistence.entity.PayRateEntity;
import com.sassfnb.adapters.persistence.entity.PayrollDetailEntity;
import com.sassfnb.adapters.persistence.entity.PayrollPeriodEntity;
import com.sassfnb.adapters.persistence.entity.StaffEntity;
import com.sassfnb.adapters.persistence.entity.UserEntity;
import com.sassfnb.adapters.persistence.repository.AttendanceRecordRepository;
import com.sassfnb.adapters.persistence.repository.PayRateRepository;
import com.sassfnb.adapters.persistence.repository.PayrollDetailRepository;
import com.sassfnb.adapters.persistence.repository.PayrollPeriodRepository;
import com.sassfnb.adapters.persistence.repository.PaymentTipsAggRepository;
import com.sassfnb.adapters.persistence.repository.StaffRepository;
import com.sassfnb.adapters.persistence.repository.UserRepository;
import com.sassfnb.adapters.rest.dto.payroll.PayrollDtos.*;
import com.sassfnb.application.domain.payroll.PayrollPeriodStatus;
import com.sassfnb.application.exception.BadRequestException;
import com.sassfnb.application.exception.NotFoundException;
import com.sassfnb.application.ports.TenantResolver;
import com.sassfnb.application.service.PayrollService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PayrollServiceImpl implements PayrollService {

    private static final BigDecimal BD_60 = BigDecimal.valueOf(60);

    private final PayRateRepository payRateRepo;
    private final PayrollPeriodRepository periodRepo;
    private final PayrollDetailRepository detailRepo;
    private final AttendanceRecordRepository attendanceRecordRepo;
    private final PaymentTipsAggRepository tipsAggRepo;

    // ✅ NEW: dùng để lookup staff -> user -> fullName
    private final StaffRepository staffRepo;
    private final UserRepository userRepo;

    private final TenantResolver tenant;

    // ========= PAY RATES =========

    @Override
    @Transactional
    public PayRateResponse createRate(PayRateUpsertRequest req) {
        UUID tenantId = tenant.currentTenantId();
        validatePayRateReq(req);

        Instant now = Instant.now();
        PayRateEntity e = PayRateEntity.builder()
                .tenantId(tenantId)
                .staffId(req.staffId())
                .outletId(req.outletId())
                .hourlyRate(req.hourlyRate().setScale(2, RoundingMode.HALF_UP))
                .effectiveFrom(req.effectiveFrom())
                .effectiveTo(req.effectiveTo())
                .createdAt(now)
                .updatedAt(now)
                .build();

        PayRateEntity saved = payRateRepo.save(e);

        StaffLite staffLite = lookupStaffLite(tenantId, saved.getStaffId());
        return toRateRes(saved, staffLite);
    }

    @Override
    @Transactional
    public PayRateResponse updateRate(UUID rateId, PayRateUpsertRequest req) {
        UUID tenantId = tenant.currentTenantId();
        validatePayRateReq(req);

        PayRateEntity e = payRateRepo.findById(rateId)
                .orElseThrow(() -> new NotFoundException("Pay rate not found: " + rateId));

        if (!Objects.equals(e.getTenantId(), tenantId)) {
            throw new BadRequestException("Pay rate does not belong to current tenant");
        }

        e.setStaffId(req.staffId());
        e.setOutletId(req.outletId());
        e.setHourlyRate(req.hourlyRate().setScale(2, RoundingMode.HALF_UP));
        e.setEffectiveFrom(req.effectiveFrom());
        e.setEffectiveTo(req.effectiveTo());
        e.setUpdatedAt(Instant.now());

        PayRateEntity saved = payRateRepo.save(e);

        StaffLite staffLite = lookupStaffLite(tenantId, saved.getStaffId());
        return toRateRes(saved, staffLite);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PayRateResponse> listRates(UUID outletId, UUID staffId, LocalDate at) {
        UUID tenantId = tenant.currentTenantId();
        if (outletId == null)
            throw new BadRequestException("outletId is required");

        List<PayRateEntity> rows = (staffId != null)
                ? payRateRepo.findByTenantIdAndOutletIdAndStaffId(tenantId, outletId, staffId)
                : payRateRepo.findByTenantIdAndOutletId(tenantId, outletId);

        if (at != null) {
            rows = rows.stream()
                    .filter(r -> !r.getEffectiveFrom().isAfter(at))
                    .filter(r -> r.getEffectiveTo() == null || !r.getEffectiveTo().isBefore(at))
                    .toList();
        }

        // ✅ bulk lookup tên cho toàn bộ staffId trong list để tối ưu
        Map<UUID, StaffLite> staffLiteMap = bulkLookupStaffLite(tenantId,
                rows.stream().map(PayRateEntity::getStaffId).filter(Objects::nonNull).collect(Collectors.toSet()));

        return rows.stream()
                .map(r -> toRateRes(r, staffLiteMap.get(r.getStaffId())))
                .toList();
    }

    private void validatePayRateReq(PayRateUpsertRequest req) {
        if (req == null)
            throw new BadRequestException("Body is required");
        if (req.staffId() == null)
            throw new BadRequestException("staffId is required");
        if (req.outletId() == null)
            throw new BadRequestException("outletId is required");
        if (req.hourlyRate() == null || req.hourlyRate().compareTo(BigDecimal.ZERO) <= 0)
            throw new BadRequestException("hourlyRate must be > 0");
        if (req.effectiveFrom() == null)
            throw new BadRequestException("effectiveFrom is required");
        if (req.effectiveTo() != null && req.effectiveTo().isBefore(req.effectiveFrom()))
            throw new BadRequestException("effectiveTo must be >= effectiveFrom");
    }

    // ========= PERIODS =========

    @Override
    @Transactional
    public PayrollPeriodResponse createPeriod(PayrollPeriodCreateRequest req) {
        UUID tenantId = tenant.currentTenantId();
        if (req == null)
            throw new BadRequestException("Body is required");
        if (req.outletId() == null)
            throw new BadRequestException("outletId is required");
        if (req.startDate() == null || req.endDate() == null)
            throw new BadRequestException("startDate/endDate is required");
        if (req.startDate().isAfter(req.endDate()))
            throw new BadRequestException("startDate must be <= endDate");

        boolean hasOpen = periodRepo.existsByTenantIdAndOutletIdAndStatus(tenantId, req.outletId(),
                PayrollPeriodStatus.OPEN);
        if (hasOpen)
            throw new BadRequestException("This outlet already has an OPEN payroll period");

        PayrollPeriodEntity p = PayrollPeriodEntity.builder()
                .tenantId(tenantId)
                .outletId(req.outletId())
                .startDate(req.startDate())
                .endDate(req.endDate())
                .status(PayrollPeriodStatus.OPEN)
                .createdAt(Instant.now())
                .closedAt(null)
                .build();

        return toPeriodRes(periodRepo.save(p));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PayrollPeriodResponse> listPeriods(UUID outletId) {
        UUID tenantId = tenant.currentTenantId();
        if (outletId == null)
            throw new BadRequestException("outletId is required");

        return periodRepo.findByTenantIdAndOutletIdOrderByStartDateDesc(tenantId, outletId)
                .stream().map(this::toPeriodRes).toList();
    }

    @Override
    @Transactional
    public PayrollPeriodResponse closePeriod(UUID periodId) {
        UUID tenantId = tenant.currentTenantId();

        PayrollPeriodEntity p = periodRepo.findByIdAndTenantId(periodId, tenantId)
                .orElseThrow(() -> new NotFoundException("Payroll period not found: " + periodId));

        if (p.getStatus() == PayrollPeriodStatus.CLOSED)
            return toPeriodRes(p);

        p.setStatus(PayrollPeriodStatus.CLOSED);
        p.setClosedAt(Instant.now());
        return toPeriodRes(periodRepo.save(p));
    }

    // ========= CALCULATE =========

    @Override
    @Transactional
    public PayrollPeriodDetailsResponse calculate(UUID periodId, boolean replaceExisting) {
        UUID tenantId = tenant.currentTenantId();

        PayrollPeriodEntity period = periodRepo.findByIdAndTenantId(periodId, tenantId)
                .orElseThrow(() -> new NotFoundException("Payroll period not found: " + periodId));

        if (period.getStatus() == PayrollPeriodStatus.CLOSED) {
            throw new BadRequestException("Payroll period is CLOSED");
        }

        if (replaceExisting) {
            detailRepo.deleteByTenantIdAndPayrollPeriodId(tenantId, periodId);
        }

        UUID outletId = period.getOutletId();
        LocalDate start = period.getStartDate();
        LocalDate end = period.getEndDate();

        // 1) hours from attendance_records.total_work_minutes
        Map<UUID, BigDecimal> hoursByStaff = new HashMap<>();
        var records = attendanceRecordRepo.findByTenantIdAndOutletIdAndWorkDateBetween(tenantId, outletId, start, end);

        for (var r : records) {
            if (r.getStaffId() == null)
                continue;
            int minutes = r.getTotalWorkMinutes() == null ? 0 : r.getTotalWorkMinutes();
            if (minutes <= 0)
                continue;

            BigDecimal hours = BigDecimal.valueOf(minutes).divide(BD_60, 4, RoundingMode.HALF_UP);
            hoursByStaff.merge(r.getStaffId(), hours, BigDecimal::add);
        }

        // 2) tips from payments (received_at)
        ZoneId zone = ZoneOffset.UTC;
        Instant fromTs = start.atStartOfDay(zone).toInstant();
        Instant toTs = end.plusDays(1).atStartOfDay(zone).toInstant();

        Map<UUID, BigDecimal> tipsByStaff = new HashMap<>();
        for (var row : tipsAggRepo.sumTipsByStaff(tenantId, outletId, fromTs, toTs)) {
            tipsByStaff.put(row.getStaffId(), nz(row.getTipsAmount()));
        }

        // staff set
        Set<UUID> staffIds = new HashSet<>();
        staffIds.addAll(hoursByStaff.keySet());
        staffIds.addAll(tipsByStaff.keySet());

        Instant now = Instant.now();
        List<PayrollDetailEntity> saved = new ArrayList<>();

        for (UUID staffId : staffIds) {
            BigDecimal totalHours = nz(hoursByStaff.get(staffId)).setScale(2, RoundingMode.HALF_UP);
            BigDecimal tips = nz(tipsByStaff.get(staffId)).setScale(2, RoundingMode.HALF_UP);

            // pick effective rate at start date (MVP)
            BigDecimal hourlyRate = payRateRepo
                    .findEffectiveRate(tenantId, outletId, staffId, start)
                    .map(PayRateEntity::getHourlyRate)
                    .orElseThrow(
                            () -> new BadRequestException("Missing pay rate for staff=" + staffId + " at " + start));

            BigDecimal gross = hourlyRate.multiply(totalHours).setScale(2, RoundingMode.HALF_UP);
            BigDecimal net = gross.add(tips).setScale(2, RoundingMode.HALF_UP);

            PayrollDetailEntity detail = detailRepo
                    .findByTenantIdAndPayrollPeriodIdAndStaffId(tenantId, periodId, staffId)
                    .orElseGet(() -> PayrollDetailEntity.builder()
                            .tenantId(tenantId)
                            .outletId(outletId)
                            .payrollPeriodId(periodId)
                            .staffId(staffId)
                            .createdAt(now)
                            .build());

            detail.setOutletId(outletId);
            detail.setTotalHours(totalHours);
            detail.setGrossPay(gross);
            detail.setTipsAmount(tips);
            detail.setNetPay(net);
            detail.setUpdatedAt(now);

            saved.add(detailRepo.save(detail));
        }

        // ✅ build staff map cho response thân thiện
        Map<UUID, StaffLite> staffLiteMap = bulkLookupStaffLite(tenantId, staffIds);

        return new PayrollPeriodDetailsResponse(
                toPeriodRes(period),
                saved.stream().map(d -> toDetailRes(d, staffLiteMap.get(d.getStaffId()))).toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PayrollPeriodDetailsResponse getPeriodDetails(UUID periodId) {
        UUID tenantId = tenant.currentTenantId();

        PayrollPeriodEntity p = periodRepo.findByIdAndTenantId(periodId, tenantId)
                .orElseThrow(() -> new NotFoundException("Payroll period not found: " + periodId));

        List<PayrollDetailEntity> details = detailRepo.findByTenantIdAndPayrollPeriodIdOrderByCreatedAtAsc(tenantId,
                periodId);

        Set<UUID> staffIds = details.stream().map(PayrollDetailEntity::getStaffId).filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<UUID, StaffLite> staffLiteMap = bulkLookupStaffLite(tenantId, staffIds);

        return new PayrollPeriodDetailsResponse(
                toPeriodRes(p),
                details.stream().map(d -> toDetailRes(d, staffLiteMap.get(d.getStaffId()))).toList());
    }

    // ========= MAPPERS =========

    private PayRateResponse toRateRes(PayRateEntity e, StaffLite staffLite) {
        return new PayRateResponse(
                e.getId(),
                e.getTenantId(),
                e.getStaffId(),
                staffLite != null ? staffLite.name() : null,
                staffLite != null ? staffLite.code() : null,
                e.getOutletId(),
                e.getHourlyRate(),
                e.getEffectiveFrom(),
                e.getEffectiveTo(),
                e.getCreatedAt(),
                e.getUpdatedAt());
    }

    private PayrollPeriodResponse toPeriodRes(PayrollPeriodEntity p) {
        return new PayrollPeriodResponse(
                p.getId(), p.getTenantId(), p.getOutletId(),
                p.getStartDate(), p.getEndDate(),
                p.getStatus(), p.getCreatedAt(), p.getClosedAt());
    }

    private PayrollDetailResponse toDetailRes(PayrollDetailEntity d, StaffLite staffLite) {
        return new PayrollDetailResponse(
                d.getId(),
                d.getPayrollPeriodId(),
                d.getOutletId(),
                d.getStaffId(),
                staffLite != null ? staffLite.name() : null,
                staffLite != null ? staffLite.code() : null,
                d.getTotalHours(),
                d.getGrossPay(),
                d.getTipsAmount(),
                d.getNetPay(),
                d.getCreatedAt(),
                d.getUpdatedAt());
    }

    private static BigDecimal nz(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }

    // ========= STAFF LOOKUP (friendly display) =========

    private record StaffLite(UUID staffId, String code, String name) {
    }

    private StaffLite lookupStaffLite(UUID tenantId, UUID staffId) {
        if (staffId == null)
            return null;

        return staffRepo.findByTenantIdAndId(tenantId, staffId)
                .map(st -> {
                    String fullName = userRepo.findById(st.getUserId())
                            .map(UserEntity::getFullName)
                            .orElse(null);
                    return new StaffLite(st.getId(), st.getCode(), normalizeName(fullName, st.getCode(), st.getId()));
                })
                .orElse(null);
    }

    private Map<UUID, StaffLite> bulkLookupStaffLite(UUID tenantId, Set<UUID> staffIds) {
        if (staffIds == null || staffIds.isEmpty())
            return Collections.emptyMap();

        List<StaffEntity> staffs = staffRepo.findByTenantIdAndIdIn(tenantId, staffIds);
        Map<UUID, StaffEntity> staffMap = staffs.stream()
                .collect(Collectors.toMap(StaffEntity::getId, Function.identity()));

        Set<UUID> userIds = staffs.stream().map(StaffEntity::getUserId).filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<UUID, UserEntity> userMap = userIds.isEmpty()
                ? Collections.emptyMap()
                : userRepo.findByIdIn(userIds).stream()
                        .collect(Collectors.toMap(UserEntity::getId, Function.identity()));

        Map<UUID, StaffLite> out = new HashMap<>();
        for (UUID sid : staffIds) {
            StaffEntity st = staffMap.get(sid);
            if (st == null)
                continue;

            UserEntity u = userMap.get(st.getUserId());
            String fullName = u != null ? u.getFullName() : null;

            out.put(sid, new StaffLite(
                    st.getId(),
                    st.getCode(),
                    normalizeName(fullName, st.getCode(), st.getId())));
        }
        return out;
    }

    private String normalizeName(String fullName, String staffCode, UUID staffId) {
        if (fullName != null && !fullName.isBlank())
            return fullName.trim();
        if (staffCode != null && !staffCode.isBlank())
            return staffCode.trim();
        return staffId != null ? staffId.toString() : null;
    }
}
