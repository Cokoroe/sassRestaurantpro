package com.sassfnb.application.service;

import com.sassfnb.adapters.persistence.entity.AuditLogEntity;
import com.sassfnb.adapters.persistence.entity.PermissionEntity;
import com.sassfnb.adapters.persistence.entity.RoleEntity;
import com.sassfnb.adapters.persistence.entity.RolePermissionEntity;
import com.sassfnb.adapters.persistence.entity.UserRoleEntity;
import com.sassfnb.adapters.persistence.repository.AuditLogRepository;
import com.sassfnb.adapters.persistence.repository.PermissionRepository;
import com.sassfnb.adapters.persistence.repository.RolePermissionRepository;
import com.sassfnb.adapters.persistence.repository.RoleRepository;
import com.sassfnb.adapters.persistence.repository.UserRoleRepository;
import com.sassfnb.adapters.rest.dto.rbac.RbacDtos.AssignUserRoleRequest;
import com.sassfnb.adapters.rest.dto.rbac.RbacDtos.CreateRoleRequest;
import com.sassfnb.adapters.rest.dto.rbac.RbacDtos.EffectiveResponse;
import com.sassfnb.adapters.rest.dto.rbac.RbacDtos.PermissionDto;
import com.sassfnb.adapters.rest.dto.rbac.RbacDtos.RoleDto;
import com.sassfnb.adapters.rest.dto.rbac.RbacDtos.UpdateRoleRequest;
import com.sassfnb.adapters.rest.dto.rbac.RbacDtos.UserRoleDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RbacService {

    private final PermissionRepository permissions;
    private final RoleRepository roles;
    private final RolePermissionRepository rolePerms;
    private final UserRoleRepository userRoles;
    private final AuditLogRepository audits;
    private final FeatureFlagMapper featureFlagMapper; // <--- mới

    /* ========================= Helpers ========================= */

    private PermissionDto mapPerm(PermissionEntity p) {
        return new PermissionDto(p.getId(), p.getCode(), p.getName(), p.getDescription());
    }

    private RoleDto mapRole(RoleEntity r, List<PermissionEntity> permList) {
        var permDtos = permList.stream().map(this::mapPerm).toList();
        return new RoleDto(
                r.getId(),
                r.getCode(),
                r.getName(),
                r.getDescription(),
                r.isSystemFlag(),
                r.getFeatureFlags(),
                permDtos);
    }

    /** Ghi audit */
    private void audit(UUID actorId, String action, String entity, UUID entityId, Map<String, Object> data) {
        var a = new AuditLogEntity();
        a.setActorUserId(actorId);
        a.setAction(action);
        a.setEntity(entity);
        a.setEntityId(entityId);
        a.setDataJson(data);
        audits.save(a);
    }

    /* ==================== 10) Permissions (read) ==================== */

    @Transactional(readOnly = true)
    public List<PermissionDto> listPermissions() {
        return permissions.findAll().stream().map(this::mapPerm).toList();
    }

    /* ==================== 11) Roles ==================== */

    @Transactional(readOnly = true)
    public List<RoleDto> listRoles() {
        var allRoles = roles.findAllByOrderByNameAsc();
        if (allRoles.isEmpty())
            return List.of();

        var roleIds = allRoles.stream().map(RoleEntity::getId).toList();
        var rpList = rolePerms.findAllByRoleIdIn(roleIds);

        // group permission ids by role
        var permIdsByRole = rpList.stream()
                .collect(Collectors.groupingBy(
                        RolePermissionEntity::getRoleId,
                        Collectors.mapping(RolePermissionEntity::getPermissionId, Collectors.toSet())));

        // load all needed permissions
        var allPermIds = rpList.stream()
                .map(RolePermissionEntity::getPermissionId)
                .collect(Collectors.toSet());

        var permMap = permissions.findByIdIn(allPermIds).stream()
                .collect(Collectors.toMap(PermissionEntity::getId, Function.identity()));

        // join
        return allRoles.stream()
                .map(r -> {
                    var ids = permIdsByRole.getOrDefault(r.getId(), Set.of());
                    var plist = ids.stream()
                            .map(permMap::get)
                            .filter(Objects::nonNull)
                            .toList();
                    return mapRole(r, plist);
                })
                .toList();
    }

    @Transactional
    public RoleDto createRole(UUID actorId, CreateRoleRequest req) {
        // create role
        var role = new RoleEntity();
        role.setCode(req.code());
        role.setName(req.name());
        role.setDescription(req.description());
        role.setSystemFlag(false);
        roles.save(role);

        // attach permissions
        var pids = new HashSet<>(req.permissionIds() == null ? List.<UUID>of() : req.permissionIds());
        if (!pids.isEmpty()) {
            var links = pids.stream().map(pid -> {
                var rp = new RolePermissionEntity();
                rp.setRoleId(role.getId());
                rp.setPermissionId(pid);
                return rp;
            }).toList();
            rolePerms.saveAll(links);
        }

        // load perms để tính feature_flags
        var plist = pids.isEmpty()
                ? List.<PermissionEntity>of()
                : permissions.findByIdIn(pids);

        var featureFlags = featureFlagMapper.fromPermissions(plist);
        role.setFeatureFlags(featureFlags);
        roles.save(role); // lưu lại feature_flags

        audit(actorId, "ROLE_CREATED", "ROLE", role.getId(),
                Map.of("code", role.getCode(), "name", role.getName()));

        return mapRole(role, plist);
    }

    @Transactional
    public RoleDto updateRole(UUID actorId, UUID roleId, UpdateRoleRequest req) {
        var role = roles.findById(roleId).orElseThrow(() -> new NoSuchElementException("Role not found"));

        if (role.isSystemFlag()) {
            throw new IllegalStateException("Không thể sửa system role.");
        }

        if (req.name() != null)
            role.setName(req.name());
        if (req.description() != null)
            role.setDescription(req.description());
        roles.save(role);

        // reset role permissions
        rolePerms.deleteByRoleId(roleId);

        var pids = new HashSet<>(req.permissionIds() == null ? List.<UUID>of() : req.permissionIds());
        if (!pids.isEmpty()) {
            var links = pids.stream().map(pid -> {
                var rp = new RolePermissionEntity();
                rp.setRoleId(roleId);
                rp.setPermissionId(pid);
                return rp;
            }).toList();
            rolePerms.saveAll(links);
        }

        // load perms mới để tính lại feature_flags
        var plist = pids.isEmpty()
                ? List.<PermissionEntity>of()
                : permissions.findByIdIn(pids);

        var featureFlags = featureFlagMapper.fromPermissions(plist);
        role.setFeatureFlags(featureFlags);
        roles.save(role);

        audit(actorId, "ROLE_UPDATED", "ROLE", roleId,
                Map.of("name", role.getName(), "description", role.getDescription()));

        return mapRole(role, plist);
    }

    /**
     * Xoá role:
     * - Nếu role là system -> chặn xoá
     * - Hard delete (có thể đổi sang soft delete sau).
     */
    @Transactional
    public void deleteRole(UUID actorId, UUID roleId) {
        var role = roles.findById(roleId).orElseThrow(() -> new NoSuchElementException("Role not found"));
        if (role.isSystemFlag()) {
            throw new IllegalStateException("Không thể xoá system role.");
        }
        // detach perms, then delete role
        rolePerms.deleteByRoleId(roleId);
        roles.deleteById(roleId);

        audit(actorId, "ROLE_DELETED", "ROLE", roleId, Map.of());
    }

    /* ==================== 12) User-roles ==================== */

    @Transactional(readOnly = true)
    public List<UserRoleDto> listUserRoles(UUID userId, UUID restaurantId, UUID outletId) {
        List<UserRoleEntity> urs;

        if (restaurantId != null && outletId != null) {
            urs = userRoles.findAllByUserIdAndRestaurantIdAndOutletId(userId, restaurantId, outletId);
        } else if (restaurantId != null) {
            urs = userRoles.findAllByUserIdAndRestaurantId(userId, restaurantId);
        } else {
            urs = userRoles.findAllByUserId(userId);
        }

        var roleIds = urs.stream().map(UserRoleEntity::getRoleId).collect(Collectors.toSet());
        var roleMap = roles.findAllById(roleIds).stream()
                .collect(Collectors.toMap(RoleEntity::getId, Function.identity()));

        return urs.stream()
                .map(ur -> {
                    var r = roleMap.get(ur.getRoleId());
                    return new UserRoleDto(
                            ur.getId(),
                            ur.getUserId(),
                            ur.getRoleId(),
                            ur.getRestaurantId(),
                            ur.getOutletId(),
                            ur.getAssignedAt(),
                            (r == null) ? null : r.getCode(),
                            (r == null) ? null : r.getName());
                })
                .toList();
    }

    @Transactional
    public UserRoleDto assignUserRole(UUID actorId, AssignUserRoleRequest req) {
        var ur = new UserRoleEntity();
        ur.setUserId(req.userId());
        ur.setRoleId(req.roleId());
        ur.setRestaurantId(req.restaurantId());
        ur.setOutletId(req.outletId());
        ur.setAssignedAt(OffsetDateTime.now());
        ur.setAssignedBy(actorId);
        userRoles.save(ur);

        audit(actorId, "USER_ROLE_ASSIGNED", "USER_ROLE", ur.getId(),
                Map.of("userId", req.userId(), "roleId", req.roleId()));

        var role = roles.findById(req.roleId()).orElse(null);
        return new UserRoleDto(
                ur.getId(), ur.getUserId(), ur.getRoleId(), ur.getRestaurantId(), ur.getOutletId(),
                ur.getAssignedAt(),
                role == null ? null : role.getCode(),
                role == null ? null : role.getName());
    }

    @Transactional
    public void unassignUserRole(UUID actorId, UUID userRoleId) {
        var ur = userRoles.findById(userRoleId)
                .orElseThrow(() -> new NoSuchElementException("UserRole not found"));
        userRoles.deleteById(userRoleId);

        audit(actorId, "USER_ROLE_UNASSIGNED", "USER_ROLE", userRoleId,
                Map.of("userId", ur.getUserId(), "roleId", ur.getRoleId()));
    }

    /* ==================== 13) Effective (resolve) ==================== */

    @Transactional(readOnly = true)
    public EffectiveResponse resolveEffective(UUID userId, UUID restaurantId, UUID outletId) {
        // Lấy user-roles theo ngữ cảnh
        List<UserRoleEntity> urs;
        if (restaurantId != null && outletId != null) {
            urs = userRoles.findAllByUserIdAndRestaurantIdAndOutletId(userId, restaurantId, outletId);
        } else if (restaurantId != null) {
            urs = userRoles.findAllByUserIdAndRestaurantId(userId, restaurantId);
        } else {
            urs = userRoles.findAllByUserId(userId);
        }

        if (urs.isEmpty()) {
            return new EffectiveResponse(List.of(), List.of());
        }

        var roleIds = urs.stream().map(UserRoleEntity::getRoleId).distinct().toList();
        var roleList = roles.findAllById(roleIds);

        // lấy quyền theo role
        var rpList = rolePerms.findAllByRoleIdIn(roleIds);
        var permIds = rpList.stream().map(RolePermissionEntity::getPermissionId).collect(Collectors.toSet());
        var permMap = permissions.findByIdIn(permIds).stream()
                .collect(Collectors.toMap(PermissionEntity::getId, Function.identity()));

        var permsByRole = rpList.stream()
                .collect(Collectors.groupingBy(
                        RolePermissionEntity::getRoleId,
                        Collectors.mapping(RolePermissionEntity::getPermissionId, Collectors.toSet())));

        // join DTO
        var roleDtos = roleList.stream()
                .map(r -> {
                    var ids = permsByRole.getOrDefault(r.getId(), Set.of());
                    var plist = ids.stream().map(permMap::get).filter(Objects::nonNull).toList();
                    return mapRole(r, plist);
                })
                .toList();

        // flatten unique permissions
        var permDtos = permMap.values().stream().map(this::mapPerm).toList();

        return new EffectiveResponse(roleDtos, permDtos);
    }
}
