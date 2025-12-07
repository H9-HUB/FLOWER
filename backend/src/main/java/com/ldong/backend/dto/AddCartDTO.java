package com.ldong.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AddCartDTO {
    @NotNull
    private Long flowerId;
    @Min(1) private Integer quantity;
}