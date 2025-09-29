package com.example.SelfOrderingRestaurant.Dto.Request.PaymentRequestDTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProcessPaymentRequestDTO {
    private Integer orderId;
    private String paymentMethod;
    private BigDecimal amount;
    private boolean confirmPayment;
}