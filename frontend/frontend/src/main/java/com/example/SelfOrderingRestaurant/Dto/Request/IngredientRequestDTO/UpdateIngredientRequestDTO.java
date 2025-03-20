package com.example.SelfOrderingRestaurant.Dto.Request.IngredientRequestDTO;

import com.example.SelfOrderingRestaurant.Enum.IngredientStatus;
import lombok.Data;

@Data
public class UpdateIngredientRequestDTO {
    private String name;
    private IngredientStatus status;
}
