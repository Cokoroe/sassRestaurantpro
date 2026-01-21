package com.sassfnb.application.service.impl;

import com.sassfnb.adapters.persistence.entity.MenuOptionEntity;
import com.sassfnb.adapters.persistence.entity.MenuOptionValueEntity;
import com.sassfnb.adapters.persistence.repository.MenuOptionRepository;
import com.sassfnb.adapters.persistence.repository.MenuOptionValueRepository;
import com.sassfnb.adapters.rest.dto.menu.MenuDtos.*;
import com.sassfnb.application.ports.TenantResolver;
import com.sassfnb.application.service.MenuOptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class MenuOptionServiceImpl implements MenuOptionService {

    private final MenuOptionRepository optRepo;
    private final MenuOptionValueRepository valRepo;
    private final TenantResolver tenantResolver;

    private UUID tenantId() {
        return tenantResolver.currentTenantId();
    }

    // =========================================================
    // OPTIONS
    // =========================================================

    @Transactional(readOnly = true)
    @Override
    public List<OptionResponse> listOptionsByItem(UUID itemId) {
        UUID tid = tenantId();

        return optRepo.findByTenantIdAndItemIdOrderByNameAsc(tid, itemId).stream()
                .map(o -> new OptionResponse(
                        o.getId(),
                        o.getItemId(),
                        o.getName(),
                        o.getRequired(),
                        "MULTI".equalsIgnoreCase(o.getSelectionType()),
                        null,
                        null))
                .toList();
    }

    @Override
    public OptionResponse addOption(UUID itemId, OptionCreateRequest req) {
        UUID tid = tenantId();

        MenuOptionEntity e = new MenuOptionEntity();
        e.setTenantId(tid);
        e.setItemId(itemId);
        e.setName(req.name());
        e.setRequired(Boolean.TRUE.equals(req.required()));
        e.setSelectionType(Boolean.TRUE.equals(req.multiSelect()) ? "MULTI" : "SINGLE");

        e = optRepo.save(e);

        return new OptionResponse(
                e.getId(),
                e.getItemId(),
                e.getName(),
                e.getRequired(),
                "MULTI".equalsIgnoreCase(e.getSelectionType()),
                null,
                null);
    }

    @Override
    public OptionResponse updateOption(UUID optionId, OptionUpdateRequest req) {
        UUID tid = tenantId();

        MenuOptionEntity e = optRepo.findByIdAndTenantId(optionId, tid)
                .orElseThrow(() -> new NoSuchElementException("Option not found"));

        if (req.name() != null)
            e.setName(req.name());
        if (req.required() != null)
            e.setRequired(req.required());
        if (req.multiSelect() != null)
            e.setSelectionType(req.multiSelect() ? "MULTI" : "SINGLE");

        e = optRepo.save(e);

        return new OptionResponse(
                e.getId(),
                e.getItemId(),
                e.getName(),
                e.getRequired(),
                "MULTI".equalsIgnoreCase(e.getSelectionType()),
                null,
                null);
    }

    @Override
    public void deleteOption(UUID optionId) {
        UUID tid = tenantId();

        MenuOptionEntity opt = optRepo.findByIdAndTenantId(optionId, tid)
                .orElseThrow(() -> new NoSuchElementException("Option not found"));

        // ✅ xoá toàn bộ value của option trước
        valRepo.deleteByMenuOptionId(opt.getId());
        optRepo.delete(opt);
    }

    // =========================================================
    // OPTION VALUES
    // =========================================================

    @Transactional(readOnly = true)
    @Override
    public List<OptionValueResponse> listValues(UUID optionId) {
        // chỉ list theo optionId là đủ, vì option đã gắn tenant
        return valRepo.findByMenuOptionIdOrderBySortOrderAscNameAsc(optionId).stream()
                .map(v -> new OptionValueResponse(
                        v.getId(),
                        v.getMenuOptionId(),
                        v.getName(),
                        v.getExtraPrice(),
                        v.getSortOrder()))
                .toList();
    }

    @Override
    public OptionValueResponse addValue(UUID optionId, OptionValueCreateRequest req) {
        UUID tid = tenantId();

        MenuOptionValueEntity v = new MenuOptionValueEntity();
        v.setTenantId(tid);
        v.setMenuOptionId(optionId);
        v.setName(req.name());
        v.setExtraPrice(req.extraPrice());
        v.setSortOrder(req.sortOrder());

        v = valRepo.save(v);

        return new OptionValueResponse(
                v.getId(),
                v.getMenuOptionId(),
                v.getName(),
                v.getExtraPrice(),
                v.getSortOrder());
    }

    @Override
    public OptionValueResponse updateValue(UUID valueId, OptionValueUpdateRequest req) {
        UUID tid = tenantId();

        MenuOptionValueEntity v = valRepo.findByIdAndTenantId(valueId, tid)
                .orElseThrow(() -> new NoSuchElementException("Option value not found"));

        if (req.name() != null)
            v.setName(req.name());
        if (req.extraPrice() != null)
            v.setExtraPrice(req.extraPrice());
        if (req.sortOrder() != null)
            v.setSortOrder(req.sortOrder());

        v = valRepo.save(v);

        return new OptionValueResponse(
                v.getId(),
                v.getMenuOptionId(),
                v.getName(),
                v.getExtraPrice(),
                v.getSortOrder());
    }

    @Override
    public void deleteValue(UUID valueId) {
        UUID tid = tenantId();

        MenuOptionValueEntity v = valRepo.findByIdAndTenantId(valueId, tid)
                .orElseThrow(() -> new NoSuchElementException("Option value not found"));

        valRepo.delete(v);
    }
}
