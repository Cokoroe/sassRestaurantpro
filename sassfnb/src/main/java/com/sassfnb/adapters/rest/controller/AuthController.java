package com.sassfnb.adapters.rest.controller;

import com.sassfnb.adapters.rest.dto.auth.AuthDtos;
import com.sassfnb.adapters.rest.dto.auth.AuthDtos.*;
import com.sassfnb.adapters.rest.dto.auth.EmailVerificationDtos.*;
import com.sassfnb.adapters.rest.dto.auth.MfaDtos.DisableRequest;
import com.sassfnb.adapters.rest.dto.auth.MfaDtos.EnableRequest;
import com.sassfnb.adapters.rest.dto.auth.MfaDtos.MfaResponse;
import com.sassfnb.adapters.rest.dto.auth.MfaDtos.SetupResponse;
import com.sassfnb.adapters.rest.dto.auth.PasswordDtos.ForgotRequest;
import com.sassfnb.adapters.rest.dto.auth.PasswordDtos.ForgotResponse;
import com.sassfnb.adapters.rest.dto.auth.PasswordDtos.ResetRequest;
import com.sassfnb.adapters.rest.dto.auth.PasswordDtos.ResetResponse;
import com.sassfnb.adapters.rest.dto.auth.SessionDtos.RevokeResponse;
import com.sassfnb.adapters.rest.dto.auth.SessionDtos.SessionsResponse;
import com.sassfnb.adapters.rest.dto.mail.SendPlainEmailRequest;
import com.sassfnb.application.service.AuthService;
import com.sassfnb.application.service.EmailVerificationService;
import com.sassfnb.application.service.MailService;
import com.sassfnb.application.service.MfaService;
import com.sassfnb.application.service.PasswordService;
import com.sassfnb.application.service.SessionService;
import com.sassfnb.config.jwt.UserPrincipal;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService auth;
    private final EmailVerificationService emailVerify;
    private final MailService mail;

    private final PasswordService passwordService;
    private final MfaService mfaService;
    private final SessionService sessionService;

    // ---------------------------------------------------------
    // Helper: lấy UserPrincipal từ Authentication
    // ---------------------------------------------------------
    private UserPrincipal getPrincipal(Authentication authCtx) {
        if (authCtx == null || authCtx.getPrincipal() == null) {
            return null;
        }
        if (authCtx.getPrincipal() instanceof UserPrincipal up) {
            return up;
        }
        return null;
    }

    @PostMapping("/register-owner")
    public ResponseEntity<?> registerOwner(
            @Valid @RequestBody RegisterOwnerRequest req,
            @RequestHeader(value = "User-Agent", required = false) String ua,
            @RequestHeader(value = "X-Forwarded-For", required = false) String ip) {

        TokenResponse token = auth.registerOwner(req, ua, ip);

        // tuỳ bạn: trả token luôn hoặc chỉ message
        return ResponseEntity
                .status(201)
                .body(token);
    }

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(
            @Valid @RequestBody LoginRequest req,
            @RequestHeader(value = "User-Agent", required = false) String ua,
            @RequestHeader(value = "X-Forwarded-For", required = false) String ip) {
        return ResponseEntity.ok(auth.login(req, ua, ip));
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(@Valid @RequestBody RefreshRequest req) {
        return ResponseEntity.ok(auth.refresh(req));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            Authentication authCtx,
            @Valid @RequestBody LogoutRequest req) {

        UserPrincipal principal = getPrincipal(authCtx);
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        UUID userId = principal.getUserId();
        auth.logout(userId, req.refreshToken(), req.allDevices());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<AuthDtos.MeResponse> getMe(Authentication authCtx) {
        UserPrincipal principal = getPrincipal(authCtx);
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        var me = auth.getCurrentUser(principal);
        return ResponseEntity.ok(me);
    }

    @PostMapping("/email/send-verify")
    public ResponseEntity<SendVerifyResponse> sendVerify(Authentication authCtx) {
        UserPrincipal principal = getPrincipal(authCtx);
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        UUID userId = principal.getUserId();
        return ResponseEntity.ok(emailVerify.sendVerify(userId));
    }

    // Cho phép lấy token ở query hoặc body
    @PostMapping("/email/verify")
    public ResponseEntity<VerifyResponse> verify(
            @RequestParam(value = "token", required = false) String tokenFromQuery,
            @Valid @RequestBody(required = false) VerifyRequest body) {

        String token = (tokenFromQuery != null) ? tokenFromQuery : (body != null ? body.token() : null);
        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest().body(new VerifyResponse("Thiếu token"));
        }
        return ResponseEntity.ok(emailVerify.verify(token));
    }

    // Gửi email text/HTML đơn giản để test (không tạo token, không audit)
    @PostMapping("/email/send-plain")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> sendPlain(Authentication authCtx,
            @Valid @RequestBody SendPlainEmailRequest req) {
        UserPrincipal principal = getPrincipal(authCtx);
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }

        var me = auth.getCurrentUser(principal);
        String defaultTo = me.email();
        String to = (req.to() == null || req.to().isBlank()) ? defaultTo : req.to();

        boolean html = Boolean.TRUE.equals(req.html());
        mail.sendEmail(to, req.subject(), req.body(), html);

        return ResponseEntity.ok(Map.of("message", "Đã gửi email."));
    }

    // 7) Forgot / Reset
    @PostMapping("/password/forgot")
    public ResponseEntity<ForgotResponse> forgot(@Valid @RequestBody ForgotRequest req) {
        return ResponseEntity.ok(passwordService.forgot(req));
    }

    @PostMapping("/password/reset")
    public ResponseEntity<ResetResponse> reset(@Valid @RequestBody ResetRequest req) {
        return ResponseEntity.ok(passwordService.reset(req));
    }

    // 8) MFA
    @PostMapping("/mfa/setup")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SetupResponse> mfaSetup(Authentication authCtx) {
        UserPrincipal principal = getPrincipal(authCtx);
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        UUID userId = principal.getUserId();
        return ResponseEntity.ok(mfaService.setup(userId));
    }

    @PostMapping("/mfa/enable")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MfaResponse> mfaEnable(
            Authentication authCtx,
            @Valid @RequestBody EnableRequest req) {

        UserPrincipal principal = getPrincipal(authCtx);
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        UUID userId = principal.getUserId();
        return ResponseEntity.ok(mfaService.enable(userId, req.code()));
    }

    @PostMapping("/mfa/disable")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MfaResponse> mfaDisable(
            Authentication authCtx,
            @Valid @RequestBody DisableRequest req) {

        UserPrincipal principal = getPrincipal(authCtx);
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        UUID userId = principal.getUserId();
        return ResponseEntity.ok(mfaService.disable(userId, req.code()));
    }

    // 9) Sessions
    @GetMapping("/sessions")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SessionsResponse> sessions(Authentication authCtx) {
        UserPrincipal principal = getPrincipal(authCtx);
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        UUID userId = principal.getUserId();
        return ResponseEntity.ok(sessionService.listSessions(userId));
    }

    @DeleteMapping("/sessions/{jti}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RevokeResponse> revoke(Authentication authCtx,
            @PathVariable String jti) {
        UserPrincipal principal = getPrincipal(authCtx);
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        UUID userId = principal.getUserId();
        return ResponseEntity.ok(sessionService.revoke(userId, jti));
    }
}
