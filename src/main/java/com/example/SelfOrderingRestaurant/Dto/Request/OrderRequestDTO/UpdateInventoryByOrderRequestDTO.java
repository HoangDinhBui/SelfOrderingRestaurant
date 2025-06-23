package com.example.SelfOrderingRestaurant.Dto.Request.OrderRequestDTO;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.util.List;

@Getter
@Setter
public class UpdateInventoryByOrderRequestDTO {

    @NotNull(message = "Table number is required")
    @Positive(message = "Table number must be positive")
    private Integer tableNumber;

    private String note;

    @NotEmpty(message = "Order items cannot be empty")
    private List<OrderItemDTO> items;

    @Getter
    @Setter
    public static class OrderItemDTO {
        @NotNull(message = "Dish name is required")
        private String dishName; // Changed from dishId to dishName

        @NotNull(message = "Quantity is required")
        @Positive(message = "Quantity must be positive")
        private Integer quantity;
    }
}