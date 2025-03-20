package com.example.SelfOrderingRestaurant.Entity.Key;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Objects;

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

//    @Override
//    public boolean equals(Object o) {
//        if (this == o) return true;
//        if (o == null || getClass() != o.getClass()) return false;
//        OrderItemKey that = (OrderItemKey) o;
//        return Objects.equals(orderId, that.orderId) &&
//                Objects.equals(dishId, that.dishId);
//    }
//
//    @Override
//    public int hashCode() {
//        return Objects.hash(orderId, dishId);
//    }
}
