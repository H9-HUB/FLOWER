package com.ldong.backend.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.ldong.backend.entity.User;

public interface UserService extends IService<User> {
    Long register(String phone, String rawPwd);
    String login(String phone, String rawPwd);
}