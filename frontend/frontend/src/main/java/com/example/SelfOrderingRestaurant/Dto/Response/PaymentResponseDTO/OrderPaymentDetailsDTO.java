package com.example.SelfOrderingRestaurant.Dto.Response.PaymentResponseDTO;

import com.example.SelfOrderingRestaurant.Dto.Request.OrderRequestDTO.OrderItemDTO;
import com.example.SelfOrderingRestaurant.Enum.PaymentMethod;
import com.example.SelfOrderingRestaurant.Enum.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class OrderPaymentDetailsDTO {
    private Integer orderId;
    private Integer tableId;
    private Date orderDate;
    private PaymentStatus paymentStatus;
    private String transactionStatus;
    private List<PaymentItemDTO> items;
    private BigDecimal discount;
    private BigDecimal totalAmount;
}