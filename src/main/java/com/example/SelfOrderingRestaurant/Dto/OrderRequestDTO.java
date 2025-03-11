package com.example.SelfOrderingRestaurant.Dto;

import com.example.SelfOrderingRestaurant.Entity.OrderItem;
import lombok.Data;

import java.util.List;

@Data
public class OrderRequestDTO {
    private Long customerId;
    private Long tableId;
    private List<OrderItem> items;
    private String notes;
}
