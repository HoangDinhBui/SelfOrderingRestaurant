package com.example.SelfOrderingRestaurant.Dto.Request.OrderRequestDTO;

import lombok.*;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@Getter
@Setter
@NoArgsConstructor
public class OrderItemDTO {
    private Integer dishId;
    private Integer quantity;
    private String notes;
    private String dishName;
    private BigDecimal price;
    private String status;
}
