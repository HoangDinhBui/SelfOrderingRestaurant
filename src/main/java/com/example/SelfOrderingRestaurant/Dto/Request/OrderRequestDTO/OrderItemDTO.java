package com.example.SelfOrderingRestaurant.Dto.Request.OrderRequestDTO;

import lombok.*;

@Data
@AllArgsConstructor
@Getter
@Setter
@NoArgsConstructor
public class OrderItemDTO {
    private Integer dishId;
    private Integer quantity;
    private String notes;
}
