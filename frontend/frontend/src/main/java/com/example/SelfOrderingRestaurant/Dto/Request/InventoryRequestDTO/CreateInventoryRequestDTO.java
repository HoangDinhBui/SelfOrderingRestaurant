package com.example.SelfOrderingRestaurant.Dto.Request.InventoryRequestDTO;

import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateInventoryRequestDTO {
    private Integer ingredientId;
    private Double quantity;
    private String unit;
    private LocalDate lastUpdated;
    private Integer supplierId;
}
