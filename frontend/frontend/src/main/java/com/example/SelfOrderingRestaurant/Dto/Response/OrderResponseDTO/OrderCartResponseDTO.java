package com.example.SelfOrderingRestaurant.Dto.Response.OrderResponseDTO;

import com.example.SelfOrderingRestaurant.Dto.Request.OrderRequestDTO.OrderItemDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderCartResponseDTO {
    private List<CartItemDTO> items;
    private BigDecimal totalAmount;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CartItemDTO {
        private Integer dishId;
        private String dishName;
        private String dishImage;
        private BigDecimal price;
        private int quantity;
        private String notes;
    }
}