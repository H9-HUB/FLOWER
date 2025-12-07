package com.ldong.backend.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("flower")
public class Flower {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long categoryId;
    private String name;
    private String title;
    private Double price;
    private Integer stock;
    private String mainImg;
    private String description;
    private String status;   // ON_SALE / OFF_SALE
    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}