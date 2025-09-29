package com.example.SelfOrderingRestaurant.Dto.Request.PaymentRequestDTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PaymentRequestDTO {
    private Integer orderId;
    private int amount;
    private String returnUrl;
}