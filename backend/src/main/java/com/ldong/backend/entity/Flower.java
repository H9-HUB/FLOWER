package com.ldong.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
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
    private LocalDateTime createTime;
}