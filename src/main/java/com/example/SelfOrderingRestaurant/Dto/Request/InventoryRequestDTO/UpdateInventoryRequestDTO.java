package com.example.SelfOrderingRestaurant.Dto.Request.InventoryRequestDTO;

import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateInventoryRequestDTO {
    private Double quantity;
    private String unit;
}
