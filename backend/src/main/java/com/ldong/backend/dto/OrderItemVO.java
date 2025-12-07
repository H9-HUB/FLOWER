package com.ldong.backend.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class OrderItemVO {
    private String flowerName;
    private BigDecimal unitPrice;
    private Integer quantity;
    private String mainImg;
}
