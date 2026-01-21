package com.sassfnb.application.service;

import com.sassfnb.adapters.persistence.entity.*;
import com.sassfnb.adapters.persistence.repository.*;
import com.sassfnb.adapters.rest.dto.auth.AuthDtos;
import com.sassfnb.adapters.rest.dto.auth.AuthDtos.LoginRequest;
import com.sassfnb.adapters.rest.dto.auth.AuthDtos.LogoutRequest;
import com.sassfnb.adapters.rest.dto.auth.AuthDtos.MeResponse;
import com.sassfnb.adapters.rest.dto.auth.AuthDtos.RefreshRequest;
import com.sassfnb.adapters.rest.dto.auth.AuthDtos.RegisterOwnerRequest;
import com.sassfnb.adapters.rest.dto.auth.AuthDtos.TokenResponse;
import com.sassfnb.config.jwt.JwtService;
import com.sassfnb.config.jwt.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository users;
    private final UserCredentialRepository creds;
    private final RefreshTokenRepository refreshRepo;
    private final RoleRepository roles;
    private final UserRoleRepository userRoles;
    private final TenantRepository tenants;
    private final StaffRepository staffRepo;
    private final RestaurantRepository restaurantRepo;
    private final OutletRepository outletRepo;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    private static final String ROOT_ROLE = "ROOT";
    private static final String OWNER_ROLE = "OWNER";

    /**
     * Lấy danh sách role code của user (ví dụ: ["ROOT","OWNER"])
     */
    private List<String> loadRoleCodes(UUID userId) {
        List<UUID> roleIds = userRoles.findByUserId(userId).stream()
                .map(UserRoleEntity::getRoleId)
                .toList();

        if (roleIds.isEmpty()) {
            return List.of();
        }

        return roles.findAllById(roleIds).stream()
                .map(RoleEntity::getCode)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    /**
     * Resolve tenantId cho 1 user:
     * - Nếu là owner => tìm theo tenants.owner_user_id
     * - Nếu không phải owner => tìm trong bảng staffs theo user_id
     */
    private UUID resolveTenantIdForUser(UUID userId) {
        // 1) thử theo owner trước
        Optional<TenantEntity> ownerTenant = tenants.findByOwnerUserId(userId);
        if (ownerTenant.isPresent()) {
            return ownerTenant.get().getId();
        }

        // 2) nếu không phải owner => thử tìm staff
        return staffRepo.findFirstByUserId(userId)
                .map(StaffEntity::getTenantId)
                .orElse(null);
    }

    // ============================================================
    // REGISTER OWNER (owner = chủ 1 hệ thống nhà hàng riêng)
    // ============================================================

    @Transactional
    public TokenResponse registerOwner(RegisterOwnerRequest req,
            String userAgent,
            String ip) {
        // 0) check trùng email
        users.findByEmailIgnoreCase(req.email()).ifPresent(u -> {
            throw new IllegalArgumentException("Email already exists");
        });

        // 1) tạo user
        var user = new UserEntity();
        user.setEmail(req.email().toLowerCase());
        user.setFullName(req.fullName());
        user.setStatus("ACTIVE");
        users.save(user);

        // 2) credential
        var uc = new UserCredentialEntity();
        uc.setUser(user);
        uc.setPasswordAlgo("BCRYPT");
        uc.setPasswordHash(encoder.encode(req.password()));
        creds.save(uc);

        // 3) gán ROLE OWNER
        var ownerRole = roles.findByCode(OWNER_ROLE)
                .orElseThrow(() -> new IllegalStateException("Missing role OWNER"));

        var ur = new UserRoleEntity();
        ur.setUserId(user.getId());
        ur.setRoleId(ownerRole.getId());
        ur.setAssignedAt(OffsetDateTime.now());
        userRoles.save(ur);

        // 4) tạo tenant cho owner (1 owner = 1 tenant riêng)
        String tenantCode = generateTenantCode(req);

        TenantEntity tenant = TenantEntity.builder()
                .name(req.restaurantName()) // tên business chính
                .code(tenantCode)
                .ownerUserId(user.getId())
                .status("ACTIVE")
                .timezone("Asia/Ho_Chi_Minh")
                .currency("VND")
                .build();

        tenants.save(tenant);

        // 5) sinh access token (chứa userId + tenantId + email + roles)
        List<String> roleCodes = loadRoleCodes(user.getId());
        String access = jwt.generateAccess(
                user.getId(),
                tenant.getId(),
                user.getEmail(),
                roleCodes);

        // 6) lưu refresh token (dùng jti làm refreshToken trả ra cho client)
        String jti = UUID.randomUUID().toString();
        var rt = new RefreshTokenEntity();
        rt.setUserId(user.getId());
        rt.setJti(jti);
        rt.setUserAgent(userAgent);
        rt.setIp(ip);
        rt.setExpiresAt(OffsetDateTime.now().plusDays(14));
        refreshRepo.save(rt);

        return new TokenResponse(access, jti, 60L * 60);
    }

    /**
     * Sinh mã tenant code duy nhất từ email (hoặc TENANTxxxx nếu trùng)
     */
    private String generateTenantCode(RegisterOwnerRequest req) {
        String prefix = req.email().split("@")[0].replaceAll("[^A-Za-z0-9]", "");
        if (prefix.length() > 10) {
            prefix = prefix.substring(0, 10);
        }
        if (prefix.isEmpty()) {
            prefix = "TENANT";
        }

        String base = prefix.toUpperCase();
        String code = base;

        while (tenants.findByCodeIgnoreCase(code).isPresent()) {
            String suffix = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
            code = base + suffix;
        }
        return code;
    }

    // ============================================================
    // LOGIN / REFRESH
    // ============================================================

    @Transactional
    public TokenResponse login(LoginRequest req, String userAgent, String ip) {
        var user = users.findByEmailIgnoreCase(req.username())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        var cred = creds.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalStateException("Credential not found"));

        if (!encoder.matches(req.password(), cred.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        if (!"ACTIVE".equals(user.getStatus())) {
            throw new IllegalStateException("User not active");
        }

        List<String> roleCodes = loadRoleCodes(user.getId());

        // *** CHỖ QUAN TRỌNG: tìm tenant cho cả owner và staff ***
        UUID tenantId = resolveTenantIdForUser(user.getId());

        String access = jwt.generateAccess(
                user.getId(),
                tenantId,
                user.getEmail(),
                roleCodes);

        String jti = UUID.randomUUID().toString();
        var rt = new RefreshTokenEntity();
        rt.setUserId(user.getId());
        rt.setJti(jti);
        rt.setUserAgent(userAgent);
        rt.setIp(ip);
        rt.setExpiresAt(OffsetDateTime.now().plusDays(14));
        refreshRepo.save(rt);

        return new TokenResponse(access, jti, 60L * 60);
    }

    @Transactional
    public TokenResponse refresh(RefreshRequest req) {
        var token = refreshRepo.findByJti(req.refreshToken())
                .orElseThrow(() -> new IllegalArgumentException("Refresh not found"));

        if (token.getRevokedAt() != null
                || token.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new IllegalArgumentException("Refresh expired/revoked");
        }

        // rotate: revoke cũ và tạo cái mới
        token.setRevokedAt(OffsetDateTime.now());
        refreshRepo.save(token);

        var user = users.findById(token.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<String> roleCodes = loadRoleCodes(token.getUserId());

        // *** dùng lại hàm resolveTenantIdForUser ***
        UUID tenantId = resolveTenantIdForUser(token.getUserId());

        String access = jwt.generateAccess(
                token.getUserId(),
                tenantId,
                user.getEmail(),
                roleCodes);

        String newJti = UUID.randomUUID().toString();
        var newRt = new RefreshTokenEntity();
        newRt.setUserId(token.getUserId());
        newRt.setJti(newJti);
        newRt.setExpiresAt(OffsetDateTime.now().plusDays(14));
        refreshRepo.save(newRt);

        return new TokenResponse(access, newJti, 60L * 60);
    }

    // ============================================================
    // LOGOUT + ME
    // ============================================================

    @Transactional
    public void logout(UUID currentUserId, String refreshToken, boolean allDevices) {
        if (allDevices) {
            refreshRepo.deleteByUserId(currentUserId);
            return;
        }
        refreshRepo.findByJti(refreshToken).ifPresent(rt -> {
            rt.setRevokedAt(OffsetDateTime.now());
            refreshRepo.save(rt);
        });
    }

    public MeResponse getCurrentUser(UserPrincipal principal) {
        UUID userId = principal.getUserId();
        UUID tenantIdFromToken = principal.getTenantId();

        var user = users.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Roles: dùng luôn từ principal
        List<String> roleCodes = principal.getRoles();

        // ====== Thông tin staff / restaurant / outlet nếu có ======
        UUID staffId = null;
        UUID restaurantId = null;
        String restaurantName = null;
        UUID outletId = null;
        String outletName = null;

        var staffOpt = staffRepo.findFirstByUserId(userId);
        if (staffOpt.isPresent()) {
            StaffEntity st = staffOpt.get();
            staffId = st.getId();
            restaurantId = st.getRestaurantId();
            outletId = st.getOutletId();

            if (restaurantId != null) {
                var rOpt = restaurantRepo.findById(restaurantId);
                if (rOpt.isPresent()) {
                    restaurantName = rOpt.get().getName();
                }
            }

            if (outletId != null) {
                var oOpt = outletRepo.findById(outletId);
                if (oOpt.isPresent()) {
                    outletName = oOpt.get().getName();
                }
            }

            // nếu tenantId trong token vẫn null thì lấy theo staff
            if (tenantIdFromToken == null) {
                tenantIdFromToken = st.getTenantId();
            }
        }

        // ====== Thông tin tenant ======
        UUID tenantId = tenantIdFromToken;
        String tenantCode = null;
        String tenantName = null;
        if (tenantId != null) {
            var tOpt = tenants.findById(tenantId);
            if (tOpt.isPresent()) {
                var t = tOpt.get();
                tenantCode = t.getCode();
                tenantName = t.getName();
            }
        }

        return new AuthDtos.MeResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getStatus(),
                user.getCreatedAt(),
                tenantId,
                tenantCode,
                tenantName,
                staffId,
                restaurantId,
                restaurantName,
                outletId,
                outletName,
                roleCodes);
    }

}
