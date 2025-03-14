package com.example.SelfOrderingRestaurant.Dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@AllArgsConstructor
public class OrderResponseDTO {
    private Integer orderId;
    private String status;
    private BigDecimal totalAmount;
    private String paymentStatus;
    private List<OrderItemDTO> items;
}
