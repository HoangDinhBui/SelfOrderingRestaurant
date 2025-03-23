package com.example.SelfOrderingRestaurant.Dto.Response.DishResponseDTO;

import com.example.SelfOrderingRestaurant.Enum.DishStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class GetAllDishesResponseDTO {
    private Integer dishId;
    private String dishName;
    private Long price;
    private DishStatus status;
}
