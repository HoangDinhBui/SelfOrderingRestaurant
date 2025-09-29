package com.example.SelfOrderingRestaurant.Dto.Response.PaymentResponseDTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PaymentNotificationStatusDTO {
    private Integer orderId;
    private boolean paymentNotificationReceived;
}