package com.sassfnb.application.service.impl;

import com.sassfnb.adapters.persistence.entity.StaffEntity;
import com.sassfnb.adapters.persistence.entity.UserCredentialEntity;
import com.sassfnb.adapters.persistence.entity.UserEntity;
import com.sassfnb.adapters.persistence.entity.UserRoleEntity;
import com.sassfnb.adapters.persistence.repository.*;
import com.sassfnb.adapters.rest.dto.staff.StaffDtos.*;
import com.sassfnb.application.ports.UploadGateway;
import com.sassfnb.application.service.StaffService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StaffServiceImpl implements StaffService {

    private final StaffRepository staffRepository;
    private final UserRepository userRepository;
    private final UserCredentialRepository userCredentialRepository;
    private final PasswordEncoder passwordEncoder;

    private final UserRoleRepository userRoleRepository;
    private final RoleRepository roleRepository;

    // ✅ NEW: upload giống menu
    private final UploadGateway upload;

    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String STATUS_INACTIVE = "INACTIVE";

    private static final String DEFAULT_STAFF_PASSWORD = "ChangeMe123!";

    // =========================================================
    // LIST
    // =========================================================
    @Override
    @Transactional(readOnly = true)
    public Page<StaffResponse> listStaff(UUID tenantId, StaffListParams params) {
        Pageable pageable = PageRequest.of(
                Optional.ofNullable(params.getPage()).orElse(0),
                Optional.ofNullable(params.getSize()).orElse(20),
                Sort.by("createdAt").descending());

        var spec = StaffSpecifications.build(
                tenantId,
                params.getRestaurantId(),
                params.getOutletId(),
                params.getQ(),
                params.getStatus());

        Page<StaffEntity> page = staffRepository.findAll(spec, pageable);

        Set<UUID> userIds = page.getContent().stream()
                .map(StaffEntity::getUserId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<UUID, UserEntity> users = userIds.isEmpty()
                ? Collections.emptyMap()
                : userRepository.findAllById(userIds).stream()
                        .collect(Collectors.toMap(UserEntity::getId, u -> u));

        return page.map(s -> toResponse(s, users.get(s.getUserId())));
    }

    // =========================================================
    // GET
    // =========================================================
    @Override
    @Transactional(readOnly = true)
    public StaffResponse getStaff(UUID tenantId, UUID staffId) {
        StaffEntity s = staffRepository.findByTenantIdAndId(tenantId, staffId)
                .orElseThrow(() -> new NoSuchElementException("Staff not found"));
        UserEntity u = (s.getUserId() == null) ? null : userRepository.findById(s.getUserId()).orElse(null);
        return toResponse(s, u);
    }

    // =========================================================
    // CREATE
    // =========================================================
    @Override
    @Transactional
    public StaffResponse createStaff(UUID tenantId, UUID actorUserId, StaffCreateRequest req) {
        if (req.getRestaurantId() == null)
            throw new IllegalArgumentException("restaurantId is required");
        if (req.getOutletId() == null)
            throw new IllegalArgumentException("outletId is required");
        if (req.getRoleId() == null)
            throw new IllegalArgumentException("roleId is required");
        if (req.getEmail() == null || req.getEmail().isBlank())
            throw new IllegalArgumentException("email is required");

        String normalizedEmail = req.getEmail().trim().toLowerCase();

        // role exists
        roleRepository.findById(req.getRoleId())
                .orElseThrow(() -> new IllegalArgumentException("roleId not found"));

        // 1) find or create user
        UserEntity user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .map(u -> {
                    boolean changed = false;

                    if (req.getFullName() != null && !req.getFullName().isBlank()
                            && !Objects.equals(u.getFullName(), req.getFullName())) {
                        u.setFullName(req.getFullName());
                        changed = true;
                    }

                    if (req.getPhone() != null && !req.getPhone().isBlank()
                            && !Objects.equals(u.getPhone(), req.getPhone())) {
                        u.setPhone(req.getPhone());
                        changed = true;
                    }

                    if (u.getStatus() == null) {
                        u.setStatus(STATUS_ACTIVE);
                        changed = true;
                    }

                    return changed ? userRepository.save(u) : u;
                })
                .orElseGet(() -> createUserForNewStaff(req, normalizedEmail));

        // 2) prevent duplicate staff profile per tenant
        if (staffRepository.existsByTenantAndUser(tenantId, user.getId())) {
            throw new IllegalStateException("This user already has a staff profile in this tenant");
        }

        // 3) check duplicate code in restaurant (nếu có code)
        if (req.getCode() != null && !req.getCode().isBlank()) {
            boolean codeExists = staffRepository.existsByTenantIdAndRestaurantIdAndCodeIgnoreCase(
                    tenantId,
                    req.getRestaurantId(),
                    req.getCode().trim());
            if (codeExists)
                throw new IllegalArgumentException("Mã nhân sự đã được dùng trong nhà hàng này");
        }

        // 4) create staff
        StaffEntity s = new StaffEntity();
        s.setTenantId(tenantId);
        s.setUserId(user.getId());
        s.setRestaurantId(req.getRestaurantId());
        s.setOutletId(req.getOutletId());
        s.setCode(req.getCode());
        s.setPosition(req.getPosition());
        s.setAvatarUrl(req.getAvatarUrl());
        s.setStatus(STATUS_ACTIVE);
        s.setHiredDate(req.getHiredDate() != null ? req.getHiredDate() : LocalDate.now());

        StaffEntity saved = staffRepository.save(s);

        // 5) assign role (user_roles)
        assignRoleToUser(actorUserId, user.getId(), req.getRoleId(), req.getRestaurantId(), req.getOutletId());

        return toResponse(saved, user);
    }

    private void assignRoleToUser(UUID actorUserId, UUID userId, UUID roleId, UUID restaurantId, UUID outletId) {
        // chặn gán trùng
        boolean exists = userRoleRepository.existsByUserIdAndRoleIdAndRestaurantIdAndOutletId(
                userId, roleId, restaurantId, outletId);
        if (exists)
            return;

        UserRoleEntity ur = new UserRoleEntity();
        ur.setUserId(userId);
        ur.setRoleId(roleId);
        ur.setRestaurantId(restaurantId);
        ur.setOutletId(outletId);
        ur.setAssignedBy(actorUserId);
        userRoleRepository.save(ur);
    }

    private UserEntity createUserForNewStaff(StaffCreateRequest req, String normalizedEmail) {
        UserEntity user = new UserEntity();
        user.setEmail(normalizedEmail);
        user.setFullName(req.getFullName());
        user.setPhone(req.getPhone());
        user.setStatus(STATUS_ACTIVE);
        user = userRepository.save(user);

        UserCredentialEntity cred = new UserCredentialEntity();
        cred.setUser(user);
        cred.setPasswordAlgo("BCRYPT");
        cred.setPasswordHash(passwordEncoder.encode(DEFAULT_STAFF_PASSWORD));
        userCredentialRepository.save(cred);

        return user;
    }

    // =========================================================
    // UPDATE
    // =========================================================
    @Override
    @Transactional
    public StaffResponse updateStaff(UUID tenantId, UUID actorUserId, UUID staffId, StaffUpdateRequest req) {
        StaffEntity s = staffRepository.findByTenantIdAndId(tenantId, staffId)
                .orElseThrow(() -> new NoSuchElementException("Staff not found"));

        // (optional) check code trùng khi đổi code
        if (req.getCode() != null && !req.getCode().isBlank()) {
            boolean exists = staffRepository.existsByTenantIdAndRestaurantIdAndCodeIgnoreCase(
                    tenantId,
                    (req.getRestaurantId() != null ? req.getRestaurantId() : s.getRestaurantId()),
                    req.getCode().trim());
            if (exists && (s.getCode() == null || !s.getCode().equalsIgnoreCase(req.getCode().trim()))) {
                throw new IllegalArgumentException("Mã nhân sự đã được dùng trong nhà hàng này");
            }
        }

        if (req.getRestaurantId() != null)
            s.setRestaurantId(req.getRestaurantId());
        if (req.getOutletId() != null)
            s.setOutletId(req.getOutletId());
        if (req.getCode() != null)
            s.setCode(req.getCode());
        if (req.getPosition() != null)
            s.setPosition(req.getPosition());
        if (req.getAvatarUrl() != null)
            s.setAvatarUrl(req.getAvatarUrl());
        if (req.getHiredDate() != null)
            s.setHiredDate(req.getHiredDate());
        if (req.getTerminatedDate() != null)
            s.setTerminatedDate(req.getTerminatedDate());

        StaffEntity saved = staffRepository.save(s);

        UserEntity u = (saved.getUserId() == null) ? null : userRepository.findById(saved.getUserId()).orElse(null);
        if (u != null) {
            boolean changed = false;

            if (req.getFullName() != null && !req.getFullName().isBlank()
                    && !Objects.equals(u.getFullName(), req.getFullName())) {
                u.setFullName(req.getFullName());
                changed = true;
            }

            if (req.getPhone() != null && !req.getPhone().isBlank()
                    && !Objects.equals(u.getPhone(), req.getPhone())) {
                u.setPhone(req.getPhone());
                changed = true;
            }

            if (changed)
                u = userRepository.save(u);
        }

        return toResponse(saved, u);
    }

    // =========================================================
    // DELETE (soft -> INACTIVE)
    // =========================================================
    @Override
    @Transactional
    public void deleteStaff(UUID tenantId, UUID actorUserId, UUID staffId) {
        StaffEntity s = staffRepository.findByTenantIdAndId(tenantId, staffId)
                .orElseThrow(() -> new NoSuchElementException("Staff not found"));
        s.setStatus(STATUS_INACTIVE);
        staffRepository.save(s);
    }

    // =========================================================
    // UPDATE STATUS
    // =========================================================
    @Override
    @Transactional
    public StaffResponse updateStatus(UUID tenantId, UUID actorUserId, UUID staffId, StaffStatusUpdateRequest req) {
        StaffEntity s = staffRepository.findByTenantIdAndId(tenantId, staffId)
                .orElseThrow(() -> new NoSuchElementException("Staff not found"));

        String st = (req.getStatus() != null) ? req.getStatus().trim().toUpperCase() : null;
        if (!STATUS_ACTIVE.equals(st) && !STATUS_INACTIVE.equals(st)) {
            throw new IllegalArgumentException("status must be ACTIVE or INACTIVE");
        }

        s.setStatus(st);
        StaffEntity saved = staffRepository.save(s);

        UserEntity u = (saved.getUserId() == null) ? null : userRepository.findById(saved.getUserId()).orElse(null);
        return toResponse(saved, u);
    }

    // =========================================================
    // OPTIONS (dropdown)
    // =========================================================
    @Override
    @Transactional(readOnly = true)
    public List<StaffOptionResponse> listOptions(UUID tenantId, UUID outletId) {
        if (outletId == null)
            throw new IllegalArgumentException("outletId is required");

        List<StaffEntity> list = staffRepository.findByTenantIdAndOutletIdAndStatus(
                tenantId, outletId, STATUS_ACTIVE);

        Set<UUID> userIds = list.stream()
                .map(StaffEntity::getUserId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<UUID, UserEntity> users = userIds.isEmpty()
                ? Collections.emptyMap()
                : userRepository.findAllById(userIds).stream()
                        .collect(Collectors.toMap(UserEntity::getId, u -> u));

        return list.stream()
                .map(s -> {
                    UserEntity u = users.get(s.getUserId());

                    String fullName = (u != null ? u.getFullName() : null);
                    String code = (s.getCode() != null && !s.getCode().isBlank()) ? s.getCode() : "NV";
                    String label = (fullName != null && !fullName.isBlank())
                            ? (code + " - " + fullName)
                            : (code + " - " + (u != null ? u.getEmail() : String.valueOf(s.getUserId())));

                    return StaffOptionResponse.builder()
                            .id(s.getId())
                            .label(label)
                            .status(s.getStatus())
                            .position(s.getPosition())
                            .avatarUrl(s.getAvatarUrl())
                            .build();
                })
                .sorted(Comparator.comparing(StaffOptionResponse::getLabel, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    // =========================================================
    // STAFF SELF
    // =========================================================
    @Override
    @Transactional(readOnly = true)
    public StaffResponse getMyStaffProfile(UUID tenantId, UUID userId) {
        StaffEntity s = staffRepository.findByTenantIdAndUserId(tenantId, userId)
                .orElseThrow(() -> new NoSuchElementException("Staff profile not found"));

        UserEntity u = (s.getUserId() == null) ? null : userRepository.findById(s.getUserId()).orElse(null);
        return toResponse(s, u);
    }

    // =========================================================
    // ✅ UPLOAD AVATAR (like menu)
    // =========================================================
    @Override
    @Transactional
    public StaffResponse uploadAvatar(UUID tenantId, UUID actorUserId, UUID staffId, MultipartFile file)
            throws IOException {
        StaffEntity s = staffRepository.findByTenantIdAndId(tenantId, staffId)
                .orElseThrow(() -> new NoSuchElementException("Staff not found"));

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        String contentType = file.getContentType();
        if (contentType == null)
            contentType = "application/octet-stream";

        if (!isAllowedImageContentType(contentType)) {
            throw new IllegalArgumentException("Only PNG/JPG/WEBP are allowed");
        }

        long maxBytes = 5L * 1024 * 1024; // 5MB
        if (file.getSize() > maxBytes) {
            throw new IllegalArgumentException("Max file size is 5MB");
        }

        // giống menu: objectKey ổn định theo staffId
        String objectKey = "staff/avatars/" + s.getId() + "/avatar";
        String url = upload.upload(objectKey, file.getBytes(), normalizeContentType(contentType));

        s.setAvatarUrl(url);
        StaffEntity saved = staffRepository.save(s);

        UserEntity u = (saved.getUserId() == null) ? null : userRepository.findById(saved.getUserId()).orElse(null);
        return toResponse(saved, u);
    }

    private static boolean isAllowedImageContentType(String ct) {
        String c = ct.toLowerCase(Locale.ROOT);
        return c.equals("image/png")
                || c.equals("image/jpeg")
                || c.equals("image/jpg")
                || c.equals("image/webp");
    }

    private static String normalizeContentType(String ct) {
        if (ct == null)
            return "application/octet-stream";
        return ct.equalsIgnoreCase("image/jpg") ? "image/jpeg" : ct;
    }

    // =========================================================
    // MAPPER
    // =========================================================
    private StaffResponse toResponse(StaffEntity s, UserEntity u) {
        return StaffResponse.builder()
                .id(s.getId())
                .tenantId(s.getTenantId())
                .userId(s.getUserId())
                .restaurantId(s.getRestaurantId())
                .outletId(s.getOutletId())
                .code(s.getCode())
                .position(s.getPosition())
                .avatarUrl(s.getAvatarUrl())
                .status(s.getStatus())
                .email(u != null ? u.getEmail() : null)
                .fullName(u != null ? u.getFullName() : null)
                .phone(u != null ? u.getPhone() : null)
                .hiredDate(s.getHiredDate())
                .terminatedDate(s.getTerminatedDate())
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .build();
    }
}
