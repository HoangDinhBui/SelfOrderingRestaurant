package com.example.SelfOrderingRestaurant.Entity.Key;

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
    private Integer orderId;
    private Integer dishId;
}
