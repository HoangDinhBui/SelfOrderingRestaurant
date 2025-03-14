package com.example.SelfOrderingRestaurant.Entity;

import com.example.SelfOrderingRestaurant.Entity.Enum.OrderItemStatus;
import com.example.SelfOrderingRestaurant.Entity.Key.OrderItemKey;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "orderitems")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class OrderItem {
    @EmbeddedId
    private OrderItemKey id;

    @ManyToOne
    @MapsId("orderId")
    @JoinColumn(name = "Order_ID")
    private Order order;

    @ManyToOne
    @MapsId("dishId")
    @JoinColumn(name = "Dish_ID")
    private Dish dish;

    @Column(name = "Quantity", nullable = false)
    private Integer quantity;

    @Column(name = "UnitPrice", precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "Notes", columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "Status")
    private OrderItemStatus status = OrderItemStatus.ORDERED;

    @Column(name = "SubTotal", insertable = false, updatable = false)
    private BigDecimal subTotal;
}
