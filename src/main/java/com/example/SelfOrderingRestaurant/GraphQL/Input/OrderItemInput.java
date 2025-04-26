package com.example.SelfOrderingRestaurant.GraphQL.Input;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
public class OrderItemInput {
    private Integer dishId;
    private Integer quantity;
    private String notes;
}
