package com.ldong.backend.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;

@Data
public class LoginDTO {
    @NotBlank private String phone;
    @NotBlank private String password;
}