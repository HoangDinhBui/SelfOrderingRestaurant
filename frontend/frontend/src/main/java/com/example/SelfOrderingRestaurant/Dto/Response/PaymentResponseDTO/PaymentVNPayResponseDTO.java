package com.example.SelfOrderingRestaurant.Dto.Response.PaymentResponseDTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PaymentVNPayResponseDTO {
    private String paymentUrl;
    private String message;
    private String transactionStatus;
    private String responseCode;
}