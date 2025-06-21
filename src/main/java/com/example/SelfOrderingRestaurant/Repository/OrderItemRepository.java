package com.example.SelfOrderingRestaurant.Repository;

import com.example.SelfOrderingRestaurant.Entity.Key.OrderItemKey;
import com.example.SelfOrderingRestaurant.Entity.Order;
import com.example.SelfOrderingRestaurant.Entity.OrderItem;
import com.example.SelfOrderingRestaurant.Enum.OrderItemStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, OrderItemKey> {
    List<OrderItem> findByOrder(Order order);

    @Query("SELECT oi FROM OrderItem oi WHERE oi.status IS NULL")
    List<OrderItem> findByStatusIsNull();

    @Query("UPDATE OrderItem oi SET oi.notes = :notes WHERE oi.id.orderId = :orderId AND oi.id.dishId = :dishId")
    @Modifying
    void updateNotes(@Param("orderId") Integer orderId, @Param("dishId") Integer dishId, @Param("notes") String notes);

    @Query("UPDATE OrderItem oi SET oi.status = :status WHERE oi.id.orderId = :orderId AND oi.id.dishId = :dishId")
    @Modifying
    void updateStatus(@Param("orderId") Integer orderId, @Param("dishId") Integer dishId, @Param("status") OrderItemStatus status);

    List<OrderItem> findByOrderOrderId(Integer orderId);
}
