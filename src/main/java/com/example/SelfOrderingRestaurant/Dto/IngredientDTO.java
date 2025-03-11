package com.example.SelfOrderingRestaurant.Dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class IngredientDTO {
    private Long ingredientId;
    private String name;
    private String description;
    private String unit;
    private BigDecimal costPerUnit;
    private String status;
}