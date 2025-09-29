package com.example.SelfOrderingRestaurant.Dto.Response.InventoryResponseDTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class GetInventoryResponseDTO {
    private Integer ingredientId;
    private Integer inventoryId;
    private Double quantity;
    private String unit;
    private Date lastUpdated;
    private String supplierName;
    private String ingredientName;
}