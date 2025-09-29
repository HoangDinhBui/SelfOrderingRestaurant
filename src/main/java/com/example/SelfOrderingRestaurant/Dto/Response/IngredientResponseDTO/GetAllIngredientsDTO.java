package com.example.SelfOrderingRestaurant.Dto.Response.IngredientResponseDTO;

import com.example.SelfOrderingRestaurant.Enum.IngredientStatus;
import lombok.Data;

@Data
public class GetAllIngredientsDTO {
    private Integer ingredientID;
    private String name;
    private IngredientStatus status;
}
