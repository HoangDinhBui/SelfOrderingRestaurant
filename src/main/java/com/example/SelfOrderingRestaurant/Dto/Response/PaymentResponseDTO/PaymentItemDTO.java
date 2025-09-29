package com.example.SelfOrderingRestaurant.Dto.Response.PaymentResponseDTO;

import lombok.*;
import java.math.BigDecimal;

@Data
@AllArgsConstructor
@Getter
@Setter
@NoArgsConstructor
public class PaymentItemDTO {
    private Integer dishId;
    private String dishName;
    private BigDecimal price;
    private Integer quantity;
    private String notes;
}