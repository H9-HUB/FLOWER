package com.ldong.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("user")
public class User {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String phone;
    @TableField("username")
    private String username; // 用户名，唯一
    private String password;
    @TableField("role")
    private UserRole role;
    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}