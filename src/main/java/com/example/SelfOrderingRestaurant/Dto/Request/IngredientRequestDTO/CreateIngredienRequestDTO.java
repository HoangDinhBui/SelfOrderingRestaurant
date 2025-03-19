package com.example.SelfOrderingRestaurant.Dto.Request.IngredientRequestDTO;

import com.example.SelfOrderingRestaurant.Enum.IngredientStatus;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateIngredienRequestDTO {
    private String name;
    private String unit;
    private BigDecimal costPerUnit;
    private IngredientStatus status;
    private Integer minimumQuantity;
    private Integer supplierId;
}
