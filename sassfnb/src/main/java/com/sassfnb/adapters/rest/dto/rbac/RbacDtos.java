package com.sassfnb.adapters.rest.dto.rbac;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class RbacDtos {

        // 10) Permissions
        public record PermissionDto(UUID id, String code, String name, String description) {
        }

        // 11) Roles
        public record RoleDto(
                        UUID id,
                        String code,
                        String name,
                        String description,
                        boolean systemFlag,
                        Map<String, Object> featureFlags,
                        List<PermissionDto> permissions) {
        }

        public record CreateRoleRequest(String code, String name, String description, List<UUID> permissionIds) {
        }

        public record UpdateRoleRequest(String name, String description, List<UUID> permissionIds) {
        }

        // 12) User-roles
        public record UserRoleDto(
                        UUID id,
                        UUID userId,
                        UUID roleId,
                        UUID restaurantId,
                        UUID outletId,
                        OffsetDateTime assignedAt,
                        String roleCode,
                        String roleName) {
        }

        public record AssignUserRoleRequest(UUID userId, UUID roleId, UUID restaurantId, UUID outletId) {
        }

        // 13) Effective
        public record EffectiveResponse(List<RoleDto> roles, List<PermissionDto> permissions) {
        }
}
