package com.ldong.backend.dto;

import lombok.Data;

@Data
public class CartVO {
    private Long id;
    private String flowerName;
    private Double price;
    private Integer quantity;
    private String mainImg;
}
