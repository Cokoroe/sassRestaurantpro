// src/main/java/com/sassfnb/application/service/ShiftService.java
package com.sassfnb.application.service;

import com.sassfnb.adapters.rest.dto.shift.ShiftDtos.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ShiftService {

    // ===== Templates =====
    List<ShiftTemplateResponse> listTemplates(UUID outletId);

    ShiftTemplateResponse createTemplate(ShiftTemplateRequest req);

    ShiftTemplateResponse updateTemplate(UUID templateId, ShiftTemplateUpdateRequest req);

    void deleteTemplate(UUID templateId);

    // ===== Scheduling =====
    List<ShiftAssignmentResponse> schedule(ShiftScheduleRequest req);

    List<ShiftAssignmentResponse> search(
            UUID outletId, LocalDate dateFrom, LocalDate dateTo,
            UUID staffId, String status);

    ShiftAssignmentResponse update(UUID shiftId, ShiftUpdateRequest req);

    void updateShiftStatus(UUID shiftId, String status);

    // ===== My shifts (staff) =====
    List<ShiftAssignmentResponse> myShifts(MyShiftSearchCriteria criteria);
}
