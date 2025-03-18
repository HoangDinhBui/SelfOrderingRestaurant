package com.example.SelfOrderingRestaurant.Dto;

import com.example.SelfOrderingRestaurant.Entity.Enum.DishStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

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