package com.example.SelfOrderingRestaurant.Dto.Response.OrderResponseDTO;

import com.example.SelfOrderingRestaurant.Dto.Request.OrderRequestDTO.OrderItemDTO;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GetAllOrdersResponseDTO {
    private Integer  orderId;
    private String customerName;
    private int tableNumber;
    private String status;
    private BigDecimal totalAmount;
    private String paymentStatus;
    private List<OrderItemDTO> items;
}
