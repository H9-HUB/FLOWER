package com.ldong.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("`order`")
public class Order {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String sn;
    private Long userId;
    private Long addressId;
    private BigDecimal totalAmount;
    private String status;   // UNPAID / PAID / CANCELLED / COMPLETED
    @TableField("create_time")
    private LocalDateTime createTime;
    @TableField("pay_time")
    private LocalDateTime payTime;
    @TableField("cancel_reason")
    private String cancelReason;
}