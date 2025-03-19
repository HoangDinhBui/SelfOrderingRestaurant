package com.example.SelfOrderingRestaurant.Dto.Request.DishRequestDTO;

import com.example.SelfOrderingRestaurant.Enum.DishStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
public class DishRequestDTO {
    @NotNull(message = "Name cannot be null")
    private String name;
    @NotNull(message = "Price cannot be null")
    private BigDecimal price;
    private int category_id;
    private DishStatus status;
}