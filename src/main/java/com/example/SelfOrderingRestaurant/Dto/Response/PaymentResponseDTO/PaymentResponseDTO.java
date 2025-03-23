package com.example.SelfOrderingRestaurant.Dto.Response.PaymentResponseDTO;

import com.example.SelfOrderingRestaurant.Enum.PaymentMethod;
import com.example.SelfOrderingRestaurant.Enum.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PaymentResponseDTO {
    private String paymentUrl;
    private String message;
}