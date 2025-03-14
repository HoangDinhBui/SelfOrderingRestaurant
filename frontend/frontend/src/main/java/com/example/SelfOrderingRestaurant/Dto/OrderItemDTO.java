package com.example.SelfOrderingRestaurant.Dto;

import lombok.*;

import java.util.List;

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
