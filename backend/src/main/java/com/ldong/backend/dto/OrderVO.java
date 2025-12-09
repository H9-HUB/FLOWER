package com.ldong.backend.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class OrderVO {
    private Long orderId;
    private String sn;
    private BigDecimal totalAmount;
    private String status;
    private List<OrderItemVO> items;
    private Long addressId;
    private String addressName;
    private String addressPhone;
    private String addressProvince;
    private String addressCity;
    private String addressDistrict;
    private String addressDetail;
    private String cancelReason;
    private LocalDateTime createTime;
    private LocalDateTime payTime;
}
