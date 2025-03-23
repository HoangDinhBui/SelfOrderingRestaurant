package com.example.SelfOrderingRestaurant.Dto.Response.OrderResponseDTO;

import com.example.SelfOrderingRestaurant.Dto.Request.OrderRequestDTO.OrderItemDTO;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@AllArgsConstructor
public class OrderResponseDTO {
    private Integer orderId;
    private String status;
    private Long totalAmount;
    private String paymentStatus;
    private List<OrderItemDTO> items;
}
