package com.ldong.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import static org.springframework.security.config.http.SessionCreationPolicy.STATELESS;

@Configuration
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf().disable()
            .cors()
            .and()
            .sessionManagement().sessionCreationPolicy(STATELESS)
            .and()
                .exceptionHandling(e -> e
                        .authenticationEntryPoint((req, res, ex) -> {
                            res.setStatus(401);
                            res.setContentType("application/json;charset=UTF-8");
                            res.getWriter().write("{\"code\":401,\"msg\":\"未登录\"}");
                        })
                        .accessDeniedHandler((req, res, ex) -> {
                            res.setStatus(403);
                            res.setContentType("application/json;charset=UTF-8");
                            res.getWriter().write("{\"code\":403,\"msg\":\"权限不足\"}");
                        })
                )
            .authorizeHttpRequests(auth -> auth
                // 允许所有预检请求，否则浏览器在跨域 PUT/DELETE 时会 401
                .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                // 明确允许 admin 登录 POST
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/admin/login").permitAll()
                .requestMatchers(
                    "/api/login",
                    "/api/register",
                    "/api/check-phone",
                    // 商品公开接口：列表与详情
                    "/api/flowers",
                    "/api/flower/**",
                    "/api/categories",
                    // 业务接口临时开放，依赖控制器内 userId 校验
                    "/api/cart/**",
                    "/api/orders/**",
                    "/api/addresses/**",
                    // 静态资源
                    "/static/**",
                    "/upload/**"
                ).permitAll()
                .anyRequest().authenticated()
            );

        // 在用户名密码过滤器之前加入 JWT 检查
        http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}