package com.ldong.backend.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ldong.backend.entity.User;
import com.ldong.backend.entity.UserRole;
import com.ldong.backend.mapper.UserMapper;
import com.ldong.backend.service.UserService;
import com.ldong.backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserServiceImpl extends ServiceImpl<UserMapper, User>
        implements UserService {

    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;


    @Override
    @Transactional
    public Long register(String phone, String username, String rawPwd) {
        if (lambdaQuery().eq(User::getPhone, phone).count() > 0)
            throw new RuntimeException("手机号已存在");
        if (lambdaQuery().eq(User::getUsername, username).count() > 0)
            throw new RuntimeException("用户名已存在");
        User u = new User();
        u.setPhone(phone);
        u.setUsername(username);
        u.setPassword(passwordEncoder.encode(rawPwd));
        u.setRole(UserRole.USER);
        save(u);
        return u.getId();
    }

    @Override
    public String login(String phone, String username, String rawPwd) {
        User u = lambdaQuery()
                .eq(User::getPhone, phone)
                .eq(User::getUsername, username)
                .one();
        if (u == null || !passwordEncoder.matches(rawPwd, u.getPassword()))
            throw new RuntimeException("手机号、用户名或密码错误");
        return jwtUtil.createToken(u.getId(), u.getRole());
    }

    @Override
    public String adminLogin(String phone, String username, String rawPwd) {
        User u = lambdaQuery()
                .eq(User::getPhone, phone)
                .eq(User::getUsername, username)
                .one();
        if (u == null || !passwordEncoder.matches(rawPwd, u.getPassword()))
            throw new RuntimeException("手机号、用户名或密码错误");
        if (u.getRole() != UserRole.ADMIN)
            throw new RuntimeException("仅限管理员登录");
        return jwtUtil.createToken(u.getId(), u.getRole());
    }
}