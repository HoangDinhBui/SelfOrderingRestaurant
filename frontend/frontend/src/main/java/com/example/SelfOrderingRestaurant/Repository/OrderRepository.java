package com.example.SelfOrderingRestaurant.Repository;

import com.example.SelfOrderingRestaurant.Entity.Order;
import com.example.SelfOrderingRestaurant.Enum.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;


@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {
    @Query("SELECT COUNT(o) FROM Order o WHERE o.tables.tableNumber = :tableNumber AND o.status NOT IN ('COMPLETED', 'CANCELED')")
    long countActiveOrdersByTableId(@Param("tableNumber") Integer tableNumber);
    @Query("SELECT o FROM Order o WHERE o.tables.tableNumber = :tableNumber")
    List<Order> findByTableNumber(@Param("tableNumber") Integer tableNumber);
    List<Order> findByPaymentStatus(PaymentStatus paymentStatus);
}
