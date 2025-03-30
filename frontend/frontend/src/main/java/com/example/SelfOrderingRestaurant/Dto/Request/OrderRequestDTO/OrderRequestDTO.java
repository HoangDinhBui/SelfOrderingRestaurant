package com.example.SelfOrderingRestaurant.Dto.Request.OrderRequestDTO;

import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;

import java.util.List;

@Data
@NoArgsConstructor
public class OrderRequestDTO {
    // Customer ID is optional as the service supports walk-in customers
    private Integer customerId;

    // Customer name is used for walk-in customers when customerId is null
    private String customerName;

    @NotNull(message = "Table ID cannot be null")
    @Min(value = 1, message = "Table ID must be positive")
    private Integer tableId;

    @NotNull(message = "Order items cannot be null")
    @NotEmpty(message = "Order must contain at least one item")
    private List<OrderItemDTO> items;

    private String notes;
}