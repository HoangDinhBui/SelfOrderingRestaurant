package com.example.SelfOrderingRestaurant.Dto.Response.DishResponseDTO;

import com.example.SelfOrderingRestaurant.Enum.DishStatus;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class DishResponseDTO {
    private Integer dishId;
    private String name;
    private BigDecimal price;
    private String catrgory;
    private DishStatus status;
}
