package com.example.SelfOrderingRestaurant.Repository;

import com.example.SelfOrderingRestaurant.Entity.Order;
import com.example.SelfOrderingRestaurant.Entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Integer> {
    public List<OrderItem> findByOrder(Order order);

    @Query("UPDATE OrderItem oi SET oi.notes = :notes WHERE oi.order.id = :orderId AND oi.dish.id = :dishId")
    public void updateNotes(@Param("orderId") Integer orderId, @Param("dishId") Integer dishId, @Param("notes") String notes);
}
