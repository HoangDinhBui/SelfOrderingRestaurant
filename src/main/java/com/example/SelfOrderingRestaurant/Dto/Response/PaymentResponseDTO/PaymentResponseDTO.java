package com.example.SelfOrderingRestaurant.Dto.Response.PaymentResponseDTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PaymentResponseDTO {
    private Integer paymentId;
    private Integer orderId;
    private BigDecimal amount;
    private String paymentMethod;
    private String paymentDate;
    private String status;
    private String transactionId;
    private String paymentUrl;
    private String message;
}