package com.example.SelfOrderingRestaurant.GraphQL.Input;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
public class OrderInput {
    private Integer customerId;
    private String customerName;
    private Integer tableId;
    private List<OrderItemInput> items;
    private String notes;
}
