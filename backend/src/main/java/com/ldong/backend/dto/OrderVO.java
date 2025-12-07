package com.ldong.backend.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class OrderVO {
    private Long orderId;
    private String sn;
    private BigDecimal totalAmount;
    private String status;
    private List<OrderItemVO> items;
}
