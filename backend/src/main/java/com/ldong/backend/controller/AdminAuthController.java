package com.ldong.backend.controller;

import com.ldong.backend.common.R;
import com.ldong.backend.dto.LoginDTO;
import com.ldong.backend.service.UserService;
import com.ldong.backend.util.JwtUtil;
import com.ldong.backend.entity.User;
import io.jsonwebtoken.Claims;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminAuthController {

    private final UserService userService;
    private final JwtUtil jwtUtil;
    @PostMapping("/login")
    public R<Map<String, Object>> login(@Valid @RequestBody LoginDTO dto, HttpServletResponse response) {
        String token;
        try {
            token = userService.adminLogin(dto.getPhone(), dto.getUsername(), dto.getPassword());
        } catch (RuntimeException e) {
            return R.error(e.getMessage());
        }
        if (token == null || token.isEmpty()) {
            return R.error("登录失败：用户名或密码错误，或无管理员权限");
        }
        try {
            Claims claims = jwtUtil.parse(token);
        } catch (Exception e) {
            return R.error("生成/解析令牌失败");
        }
        // 设置响应头，方便 apifox/前端直接使用
        response.setHeader("Authorization", "Bearer " + token);

        User u = userService.getById(Long.valueOf(jwtUtil.parse(token).getSubject()));
        Map<String, Object> data = new HashMap<>();
        Map<String, Object> userInfo = new HashMap<>();
        if (u != null) {
            userInfo.put("id", u.getId());
            userInfo.put("username", u.getUsername());
            userInfo.put("role", u.getRole() == null ? null : u.getRole().name());
        }
        data.put("token", token);
        data.put("userInfo", userInfo);
        return R.ok(data);
    }
}
