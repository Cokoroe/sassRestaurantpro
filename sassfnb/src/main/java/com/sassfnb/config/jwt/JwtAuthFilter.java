package com.sassfnb.config.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class);

    private final JwtService jwt;
    private final AntPathMatcher matcher = new AntPathMatcher();

    /**
     * Default whitelist (an toàn để public không bao giờ bị yêu cầu token ở filter
     * level).
     * SecurityConfig vẫn là nơi quyết định permitAll/authenticated, nhưng filter
     * skip giúp debug dễ hơn.
     */
    private final List<String> defaultWhitelist = List.of(
            "/api/v1/public/**",
            "/error",
            "/swagger-ui/**",
            "/v3/api-docs/**");

    /**
     * Optional extra whitelist set từ SecurityConfig (nếu bạn muốn).
     */
    private String[] extraWhitelist = new String[0];

    public JwtAuthFilter(JwtService jwt) {
        this.jwt = jwt;
    }

    public JwtAuthFilter withWhitelist(String... patterns) {
        this.extraWhitelist = (patterns == null) ? new String[0] : patterns;
        return this;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();

        // Always allow CORS preflight
        if (HttpMethod.OPTIONS.matches(request.getMethod()))
            return true;

        // Default whitelist
        for (String p : defaultWhitelist) {
            if (matcher.match(p, path))
                return true;
        }

        // Extra whitelist (if configured)
        for (String p : extraWhitelist) {
            if (matcher.match(p, path))
                return true;
        }

        return false;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest req,
            HttpServletResponse res,
            FilterChain chain) throws ServletException, IOException {

        String path = req.getRequestURI();
        String header = req.getHeader(HttpHeaders.AUTHORIZATION);

        log.debug("[JwtAuthFilter] {} {} AuthorizationPresent={}",
                req.getMethod(), path, header != null);

        // No bearer -> just continue
        if (header == null || !header.startsWith("Bearer ")) {
            if (header != null) {
                log.warn("[JwtAuthFilter] Authorization header present but not Bearer. path={} header={}", path,
                        header);
            }
            chain.doFilter(req, res);
            return;
        }

        String token = header.substring(7).trim();

        try {
            Claims claims = jwt.parse(token).getBody();

            UUID userId = UUID.fromString(claims.getSubject());
            String email = claims.get("email", String.class);

            UUID tenantId = null;
            String tenantIdStr = claims.get("tenantId", String.class);
            if (tenantIdStr != null && !tenantIdStr.isBlank()) {
                tenantId = UUID.fromString(tenantIdStr);
            }

            List<String> roles = extractRoles(claims.get("roles"));
            var authorities = roles.stream()
                    .map(SimpleGrantedAuthority::new)
                    .collect(Collectors.toList());

            UserPrincipal principal = new UserPrincipal(
                    userId,
                    tenantId,
                    email,
                    roles,
                    authorities);

            var auth = new UsernamePasswordAuthenticationToken(principal, null, authorities);
            SecurityContextHolder.getContext().setAuthentication(auth);

            log.debug("[JwtAuthFilter] AUTH OK userId={} tenantId={} roles={} path={}",
                    userId, tenantId, roles, path);

        } catch (ExpiredJwtException e) {
            log.warn("[JwtAuthFilter] TOKEN EXPIRED path={} msg={}", path, e.getMessage());
        } catch (JwtException e) {
            log.warn("[JwtAuthFilter] TOKEN INVALID path={} type={} msg={}",
                    path, e.getClass().getSimpleName(), e.getMessage());
        } catch (Exception e) {
            log.error("[JwtAuthFilter] AUTH ERROR path={} type={} msg={}",
                    path, e.getClass().getSimpleName(), e.getMessage(), e);
        }

        chain.doFilter(req, res);
    }

    @SuppressWarnings("unchecked")
    private List<String> extractRoles(Object raw) {
        if (raw instanceof Collection<?> col) {
            return col.stream().map(Object::toString).toList();
        }
        if (raw instanceof String s) {
            return Arrays.stream(s.split(","))
                    .map(String::trim)
                    .filter(x -> !x.isEmpty())
                    .toList();
        }
        return Collections.emptyList();
    }
}
