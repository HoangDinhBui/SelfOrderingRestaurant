package com.example.SelfOrderingRestaurant.Dto.Response.DishResponseDTO;

import com.example.SelfOrderingRestaurant.Enum.DishStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DishResponseDTO {
    private String name;
    private Long price;
    private Integer categoryId;
    private DishStatus status;
}
