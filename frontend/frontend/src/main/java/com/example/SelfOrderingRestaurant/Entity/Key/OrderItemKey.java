package com.example.SelfOrderingRestaurant.Entity.Key;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Embeddable
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class OrderItemKey {
    @Column(name = "Order_ID")
    private Integer orderId;

    @Column(name = "Dish_ID")
    private Integer dishId;
}
