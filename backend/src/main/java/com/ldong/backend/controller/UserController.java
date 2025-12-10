package com.ldong.backend.controller;

import com.ldong.backend.common.R;
import com.ldong.backend.dto.LoginDTO;
import com.ldong.backend.dto.RegisterDTO;
import com.ldong.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import com.ldong.backend.entity.User;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;


    @PostMapping("/register")
    public R<Long> register(@Valid @RequestBody RegisterDTO dto) {
        Long id = userService.register(dto.getPhone(), dto.getUsername(), dto.getPassword());
        return R.ok(id);
    }

    @PostMapping("/login")
    public R<String> login(@Valid @RequestBody LoginDTO dto) {
        String token = userService.login(dto.getPhone(), dto.getUsername(), dto.getPassword());
        return R.ok(token);
    }

    @GetMapping("/check-phone")
    public R<Boolean> checkPhone(@RequestParam String phone) {
        boolean exist = userService.lambdaQuery().eq(User::getPhone, phone).count() > 0;
        return R.ok(exist);
    }
}