package com.example.SelfOrderingRestaurant.Dto;

import lombok.Data;

@Data
public class OrderItemDTO {
    private Long dishId;
    private int quantity;
    private String notes;
}
