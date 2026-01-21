package com.sassfnb.application.service;

import com.sassfnb.adapters.rest.dto.staff.StaffDtos.*;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

public interface StaffService {

    Page<StaffResponse> listStaff(UUID tenantId, StaffListParams params);

    StaffResponse getStaff(UUID tenantId, UUID staffId);

    StaffResponse createStaff(UUID tenantId, UUID actorUserId, StaffCreateRequest req);

    StaffResponse updateStaff(UUID tenantId, UUID actorUserId, UUID staffId, StaffUpdateRequest req);

    void deleteStaff(UUID tenantId, UUID actorUserId, UUID staffId);

    StaffResponse updateStatus(UUID tenantId, UUID actorUserId, UUID staffId, StaffStatusUpdateRequest req);

    // dropdown for scheduler
    List<StaffOptionResponse> listOptions(UUID tenantId, UUID outletId);

    // staff self
    StaffResponse getMyStaffProfile(UUID tenantId, UUID userId);

    // ✅ NEW: upload avatar giống menu
    StaffResponse uploadAvatar(UUID tenantId, UUID actorUserId, UUID staffId, MultipartFile file) throws IOException;
}
