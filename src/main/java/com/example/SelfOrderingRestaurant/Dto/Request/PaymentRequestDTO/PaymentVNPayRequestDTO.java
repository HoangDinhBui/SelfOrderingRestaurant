package com.example.SelfOrderingRestaurant.Dto.Request.PaymentRequestDTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PaymentVNPayRequestDTO {
    private Integer total;
    private String orderInfo;
    private String returnUrl;
    private Integer orderId;
}