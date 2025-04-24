package com.example.SelfOrderingRestaurant.GraphQL.Input;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
public class OrderItemInput {
    private String dishId;
    private int quantity;
    private String notes;
}
