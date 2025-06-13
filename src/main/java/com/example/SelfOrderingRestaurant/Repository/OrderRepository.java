package com.example.SelfOrderingRestaurant.Repository;

import com.example.SelfOrderingRestaurant.Entity.DinningTable;
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
    @Query("SELECT o FROM Order o WHERE o.tables.tableNumber = :tableNumber AND o.paymentStatus = :paymentStatus")
    List<Order> findByTableNumberAndPaymentStatus(@Param("tableNumber") Integer tableNumber, @Param("paymentStatus") PaymentStatus paymentStatus);
    @Query("SELECT CASE WHEN COUNT(o) > 0 THEN true ELSE false END FROM Order o WHERE o.tables.tableNumber = :tableNumber AND o.paymentStatus = :paymentStatus")
    boolean existsByTablesTableNumberAndPaymentStatus(@Param("tableNumber") Integer tableNumber, @Param("paymentStatus") PaymentStatus paymentStatus);

}
