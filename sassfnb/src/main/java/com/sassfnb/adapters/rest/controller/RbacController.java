package com.sassfnb.adapters.rest.controller;

import com.sassfnb.adapters.rest.dto.rbac.RbacDtos.*;
import com.sassfnb.application.service.RbacService;
import com.sassfnb.config.jwt.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rbac")
@RequiredArgsConstructor
public class RbacController {

    private final RbacService rbac;

    // helper để lấy actorId cho gọn
    private UUID getActorId(Authentication authCtx) {
        UserPrincipal principal = (UserPrincipal) authCtx.getPrincipal();
        // ĐỔI TÊN HÀM Ở DÒNG DƯỚI CHO ĐÚNG VỚI UserPrincipal CỦA BẠN
        return principal.getUserId(); // nếu class bạn dùng getId() thì sửa thành principal.getId();
    }

    // 10) Danh sách permission
    @GetMapping("/permissions")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<PermissionDto>> listPermissions() {
        return ResponseEntity.ok(rbac.listPermissions());
    }

    // 11) Roles
    @GetMapping("/roles")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<RoleDto>> listRoles() {
        return ResponseEntity.ok(rbac.listRoles());
    }

    @PostMapping("/roles")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RoleDto> createRole(Authentication authCtx,
            @Valid @RequestBody CreateRoleRequest req) {
        UUID actor = getActorId(authCtx);
        return ResponseEntity.ok(rbac.createRole(actor, req));
    }

    @PutMapping("/roles/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RoleDto> updateRole(Authentication authCtx,
            @PathVariable("id") UUID id,
            @Valid @RequestBody UpdateRoleRequest req) {
        UUID actor = getActorId(authCtx);
        return ResponseEntity.ok(rbac.updateRole(actor, id, req));
    }

    @DeleteMapping("/roles/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteRole(Authentication authCtx,
            @PathVariable("id") UUID id) {
        UUID actor = getActorId(authCtx);
        rbac.deleteRole(actor, id);
        return ResponseEntity.noContent().build();
    }

    // 12) Gán role cho user
    @GetMapping("/user-roles")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<UserRoleDto>> listUserRoles(
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) UUID restaurantId,
            @RequestParam(required = false) UUID outletId) {

        if (userId == null) {
            return ResponseEntity.ok(List.of());
        }
        return ResponseEntity.ok(rbac.listUserRoles(userId, restaurantId, outletId));
    }

    @PostMapping("/user-roles")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserRoleDto> assignUserRole(Authentication authCtx,
            @Valid @RequestBody AssignUserRoleRequest req) {
        UUID actor = getActorId(authCtx);
        return ResponseEntity.ok(rbac.assignUserRole(actor, req));
    }

    @DeleteMapping("/user-roles/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> unassignUserRole(Authentication authCtx,
            @PathVariable("id") UUID id) {
        UUID actor = getActorId(authCtx);
        rbac.unassignUserRole(actor, id);
        return ResponseEntity.noContent().build();
    }

    // 13) Effective
    @GetMapping("/effective")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<EffectiveResponse> effective(Authentication authCtx,
            @RequestParam(required = false) UUID restaurantId,
            @RequestParam(required = false) UUID outletId) {
        UUID currentUser = getActorId(authCtx);
        return ResponseEntity.ok(rbac.resolveEffective(currentUser, restaurantId, outletId));
    }
}
