package com.example.SelfOrderingRestaurant.Repository;

import com.example.SelfOrderingRestaurant.Entity.Key.OrderItemKey;
import com.example.SelfOrderingRestaurant.Entity.Order;
import com.example.SelfOrderingRestaurant.Entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OrderItemRepository extends JpaRepository<OrderItem, Integer> {
    List<OrderItem> findByOrder(Order order);

    @Modifying
    @Query("UPDATE OrderItem oi SET oi.notes = :notes WHERE oi.order.orderId = :orderId AND oi.dish.dishId = :dishId")
    void updateNotes(@Param("orderId") Integer orderId, @Param("dishId") Integer dishId, @Param("notes") String notes);

    @Modifying
    @Query("DELETE FROM OrderItem oi WHERE oi.order = :order")
    void deleteByOrder(@Param("order") Order order);
    Optional<OrderItem> findById(OrderItemKey id);
}
