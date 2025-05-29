package com.example.SelfOrderingRestaurant.Dto.Response.DishIngredientResponseDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.apache.poi.hpsf.Decimal;

import java.math.BigDecimal;
import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DishIngredientResponseDTO {
    private Integer dishId;
    private Integer ingredientId;
    private BigDecimal quantity;


}