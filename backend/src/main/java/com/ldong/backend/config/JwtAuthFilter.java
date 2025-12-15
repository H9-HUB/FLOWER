package com.ldong.backend.config;

import com.ldong.backend.util.JwtUtil;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.Collections;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtUtil jwtUtil;

    public JwtAuthFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String auth = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (auth != null && auth.startsWith("Bearer ")) {
            String token = auth.substring(7);
            try {
                Claims c = jwtUtil.parse(token);
                // 将 userId 放入请求属性，供后续使用
                Long userId = Long.valueOf(c.getSubject());
                request.setAttribute("USER_ID", userId);
                String role = String.valueOf(c.get("role"));
                request.setAttribute("USER_ROLE", role);
                // 同时设置 SecurityContext，这样 Spring Security 会认为该请求已认证
                SimpleGrantedAuthority ga = new SimpleGrantedAuthority(role == null ? "" : role);
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(userId, null, Collections.singletonList(ga));
                SecurityContextHolder.getContext().setAuthentication(authToken);
                // Debug headers to help clients verify auth was recognized
                response.setHeader("X-User-Id", String.valueOf(userId));
                if (role != null) response.setHeader("X-User-Role", role);
            } catch (Exception ignored) {}
        }
        filterChain.doFilter(request, response);
    }
}
