package com.example.SelfOrderingRestaurant.Repository;

import com.example.SelfOrderingRestaurant.Entity.DinningTable;
import com.example.SelfOrderingRestaurant.Entity.Order;
import com.example.SelfOrderingRestaurant.Enum.OrderStatus;
import com.example.SelfOrderingRestaurant.Enum.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;


@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {
    @Query("SELECT COUNT(o) FROM Order o WHERE o.tables.tableNumber = :tableNumber AND o.status NOT IN ('COMPLETED', 'CANCELLED')")
    long countActiveOrdersByTableId(@Param("tableNumber") Integer tableNumber);
    @Query("SELECT o FROM Order o WHERE o.tables.tableNumber = :tableNumber")
    List<Order> findByTableNumber(@Param("tableNumber") Integer tableNumber);
    List<Order> findByPaymentStatus(PaymentStatus paymentStatus);
    @Query("SELECT o FROM Order o WHERE o.tables.tableNumber = :tableNumber AND o.paymentStatus = :paymentStatus")
    List<Order> findByTableNumberAndPaymentStatus(@Param("tableNumber") Integer tableNumber, @Param("paymentStatus") PaymentStatus paymentStatus);
    // Cancelled orders are never paid, so they must not keep the table occupied
    @Query("SELECT CASE WHEN COUNT(o) > 0 THEN true ELSE false END FROM Order o WHERE o.tables.tableNumber = :tableNumber AND o.paymentStatus = :paymentStatus AND o.status <> 'CANCELLED'")
    boolean existsByTablesTableNumberAndPaymentStatus(@Param("tableNumber") Integer tableNumber, @Param("paymentStatus") PaymentStatus paymentStatus);
    
    List<Order> findByCustomerCustomerIdOrderByOrderDateDesc(Integer customerId);

    @Query("SELECT o FROM Order o WHERE o.tables.tableNumber = :tableNumber AND o.status IN :statuses AND o.reservationTime BETWEEN :from AND :to")
    List<Order> findReservationsOnTableBetween(@Param("tableNumber") Integer tableNumber, @Param("statuses") List<OrderStatus> statuses,
                                               @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    List<Order> findByReservationTimeIsNotNullOrderByReservationTimeAsc();

    // Đơn đang phục vụ tại bàn: chưa thanh toán, không phải lịch hẹn chưa nhận khách
    @Query("SELECT CASE WHEN COUNT(o) > 0 THEN true ELSE false END FROM Order o WHERE o.tables.tableNumber = :tableNumber AND o.paymentStatus = 'UNPAID' AND o.status NOT IN ('CANCELLED', 'SCHEDULED', 'CONFIRMED', 'COMPLETED') AND (:excludeOrderId IS NULL OR o.orderId <> :excludeOrderId)")
    boolean existsServingUnpaidOrderOnTable(@Param("tableNumber") Integer tableNumber, @Param("excludeOrderId") Integer excludeOrderId);
}
