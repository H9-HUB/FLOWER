package com.ldong.backend.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;

@Data
public class LoginDTO {
    @NotBlank(message = "手机号不能为空")
    private String phone;

    @NotBlank(message = "用户名不能为空")
    private String username;

    @NotBlank(message = "密码不能为空")
    private String password;
}