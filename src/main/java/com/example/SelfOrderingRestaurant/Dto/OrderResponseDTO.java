package com.example.SelfOrderingRestaurant.Dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class OrderResponseDTO {
    private Long orderId;
    private String status;
    private BigDecimal totalAmount;
    private String paymentStatus;
}
