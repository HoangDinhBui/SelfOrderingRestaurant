package com.example.SelfOrderingRestaurant.Dto.Request.OrderRequestDTO;

import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotNull;

import java.util.List;

@Data
@NoArgsConstructor
public class OrderRequestDTO {
    @NotNull(message = "Customer ID cannot be null")
    private Integer customerId;
    @NotNull(message = "Table ID cannot be null")
    private int tableId;
    private List<OrderItemDTO> items;
    private String notes;
}
