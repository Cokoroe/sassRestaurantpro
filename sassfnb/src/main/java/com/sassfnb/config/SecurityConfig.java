package com.sassfnb.config;

import com.sassfnb.config.jwt.JwtAuthFilter;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

        private final JwtAuthFilter jwtAuthFilter;

        // ===== KHÔNG CẦN TOKEN =====
        private static final String[] PUBLIC = {
                        "/api/v1/auth/register-owner",
                        "/api/v1/auth/login",
                        "/api/v1/auth/refresh",
                        "/api/v1/auth/email/verify",
                        "/api/v1/auth/password/forgot",
                        "/api/v1/auth/password/reset",
                        "/api/v1/public/**",
                        "/public/**",
                        "/v3/api-docs/**",
                        "/swagger-ui/**",
                        "/swagger-ui.html",
                        "/actuator/health",
                        "/public/qr/**",
                        "/files/**",
                        "/error",
                        "/api/v1/payments/sepay/webhook/**"
        };

        // ===== CẦN ĐĂNG NHẬP (bất kỳ quyền nào) =====
        private static final String[] AUTHENTICATED_COMMON = {
                        "/api/v1/auth/logout",
                        "/api/v1/auth/me",
                        "/api/v1/auth/sessions",
                        "/api/v1/auth/sessions/**",
                        "/api/v1/me/**",
                        "/api/v1/auth/mfa/**",
                        "/api/v1/auth/sessions/**",
                        "/api/v1/auth/email/send-verify",
                        "/api/v1/auth/email/send-plain",
                        "/api/v1/profile/**",
                        "/api/v1/rbac/permissions",
                        "/api/v1/rbac/roles",
                        "/api/v1/rbac/roles/**",
                        "/api/v1/rbac/user-roles",
                        "/api/v1/rbac/user-roles/**",
                        "/api/v1/rbac/effective",
                        "/api/v1/attendance/**",
                        "/api/v1/tables/**"

        };

        private static final String[] TENANT_CONFIG = {
                        "/api/v1/restaurants/**",
                        "/api/v1/outlets/**"
        };

        // ===== MENU (tách theo METHOD để không đè role) =====
        private static final String[] MENU_GET = {
                        "/api/v1/menu/categories",
                        "/api/v1/menu/categories/*",
                        "/api/v1/menu/categories/tree",

                        "/api/v1/menu/items",
                        "/api/v1/menu/items/*",
                        "/api/v1/menu/items/*/options",
                        "/api/v1/menu/items/*/options/*/values"
        };
        private static final String[] MENU_POST = {
                        "/api/v1/menu/categories",

                        "/api/v1/menu/items",
                        "/api/v1/menu/items/*/duplicate",
                        "/api/v1/menu/items/*/options",
                        "/api/v1/menu/items/*/options/*/values"
        };
        private static final String[] MENU_PUT = {
                        "/api/v1/menu/categories/*",

                        "/api/v1/menu/items/*",
                        "/api/v1/menu/items/*/options/*",
                        "/api/v1/menu/items/*/options/*/values/*"
        };
        private static final String[] MENU_PATCH = {
                        "/api/v1/menu/categories/*/reorder",

                        "/api/v1/menu/items/*/publish"
        };
        private static final String[] MENU_DELETE = {
                        "/api/v1/menu/categories/*",

                        "/api/v1/menu/items/*",
                        "/api/v1/menu/items/*/options/*",
                        "/api/v1/menu/items/*/options/*/values/*"
        };

        // ===== Nhóm quyền tái sử dụng =====
        private static final String[] ROLE_ADMIN_SET = { "ROOT", "OWNER", "ADMIN" };
        private static final String[] ROLE_STAFF_SET = { "ROOT", "OWNER", "ADMIN", "MANAGER", "STAFF" };

        // ===== Các nhóm path theo role hiện có (GIỮ NGUYÊN) =====
        // LƯU Ý: BỎ "/api/v1/menu/**" khỏi ROOT để không nuốt quyền GET của STAFF
        private static final String[] ROOT = { "/api/v1/root/**", "/api/v1/users/**" };
        private static final String[] STAFF = { "/api/v1/staff/**", "/api/v1/orders/**", "/api/v1/kitchen/**",
                        "/api/v1/kds/**" };
        private static final String[] CUSTOMER = { "/api/v1/customer/**", "/api/v1/orders/**" };
        private static final String[] SUPPLIER = { "/api/v1/supplier/**" };
        private static final String[] ADMIN_SYSTEM = { "/api/v1/adminsystem/**" };
        private static final String[] REPORTS = { "/api/v1/reports/**" };

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
                http
                                .cors(Customizer.withDefaults())
                                .csrf(csrf -> csrf.disable())
                                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .exceptionHandling(e -> e.authenticationEntryPoint((req, res, ex) -> {
                                        res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                                        res.setContentType("application/json");
                                        res.getWriter().write("{\"message\":\"Thiếu hoặc token không hợp lệ.\"}");
                                }))
                                .authorizeHttpRequests(auth -> auth
                                                // Preflight
                                                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                                                // Public
                                                .requestMatchers(PUBLIC).permitAll()

                                                // MENU: Staff đọc, Admin/Owner/Root ghi
                                                .requestMatchers(HttpMethod.GET, MENU_GET)
                                                .hasAnyAuthority(ROLE_STAFF_SET)
                                                .requestMatchers(HttpMethod.POST, MENU_POST)
                                                .hasAnyAuthority(ROLE_ADMIN_SET)
                                                .requestMatchers(HttpMethod.PUT, MENU_PUT)
                                                .hasAnyAuthority(ROLE_ADMIN_SET)
                                                .requestMatchers(HttpMethod.PATCH, MENU_PATCH)
                                                .hasAnyAuthority(ROLE_ADMIN_SET)
                                                .requestMatchers(HttpMethod.DELETE, MENU_DELETE)
                                                .hasAnyAuthority(ROLE_ADMIN_SET)

                                                // Nhóm path theo role (giữ nguyên behavior cũ)
                                                .requestMatchers(ROOT).hasAuthority("ROOT")
                                                .requestMatchers(STAFF).hasAnyAuthority(ROLE_STAFF_SET)
                                                .requestMatchers(CUSTOMER).hasAuthority("CUSTOMER")
                                                .requestMatchers(SUPPLIER).hasAuthority("SUPPLIER")
                                                .requestMatchers(ADMIN_SYSTEM).hasAuthority("ADMIN_SYSTEM")

                                                // Tenant config
                                                .requestMatchers(TENANT_CONFIG)
                                                .hasAnyAuthority("ROOT", "OWNER", "ADMIN")

                                                // Authenticated chung
                                                .requestMatchers(AUTHENTICATED_COMMON).authenticated()

                                                .requestMatchers(REPORTS)
                                                .hasAnyAuthority("ROOT", "OWNER", "ADMIN", "MANAGER")

                                                // Mặc định
                                                .anyRequest().authenticated())
                                // filter chỉ whitelist đúng các route PUBLIC
                                .addFilterBefore(jwtAuthFilter.withWhitelist(PUBLIC),
                                                UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }

        @Bean
        PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }

        @Bean
        AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
                return cfg.getAuthenticationManager();
        }

        @Bean
        public WebMvcConfigurer corsConfigurer() {
                return new WebMvcConfigurer() {
                        @Override
                        public void addCorsMappings(CorsRegistry registry) {
                                registry.addMapping("/**")
                                                .allowedOrigins("http://localhost:5173", "http://localhost:5174",
                                                                "http://localhost:5432")
                                                .allowedMethods("*")
                                                .allowCredentials(true);
                        }
                };
        }
}
