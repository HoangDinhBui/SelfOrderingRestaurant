package com.example.SelfOrderingRestaurant.Dto.Response.InventoryResponseDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor

public class RemainingInventoryResponseDTO {
    private Integer ingredientId;
    private Integer inventoryId;
    private String ingredientName;
    private String supplierName;
    private Double remainingQuantity; // Sử dụng Double để đồng bộ với Inventory.quantity
    private String unit;
    private Date lastUpdated;
}
