package com.example.SelfOrderingRestaurant.Dto.Request.DishRequestDTO;

import com.example.SelfOrderingRestaurant.Enum.DishStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DishRequestDTO {
    private String name;
    private BigDecimal price;
    private Integer categoryId;
    private String description;
    private String image;
    private DishStatus status;
}
