package com.example.SelfOrderingRestaurant.Repository;

import com.example.SelfOrderingRestaurant.Entity.Order;
import com.example.SelfOrderingRestaurant.Entity.Payment;
import com.example.SelfOrderingRestaurant.Enum.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {
    Payment findByTransactionId(String transactionId);
    Payment findByOrder_OrderId(Integer orderId);
    List<Payment> findByOrderAndStatus(Order order, PaymentStatus status);
    Optional<Payment> findTopByOrderAndStatusOrderByPaymentDateDesc(Order order, PaymentStatus status);
    Optional<Payment> findTopByOrder_OrderIdAndStatusOrderByPaymentDateDesc(Integer orderId, PaymentStatus status);
    List<Payment> findByStatusAndPaymentDateBefore(PaymentStatus status, LocalDateTime dateTime);
    Optional<Payment> findTopByOrderAndStatusNotOrderByPaymentDateDesc(Order order, PaymentStatus status);
    Optional<Payment> findTopByOrderAndStatusInOrderByPaymentDateDesc(Order order, List<PaymentStatus> statuses);
    List<Payment> findByOrderAndStatusIn(Order order, List<PaymentStatus> statuses);
    Optional<Payment> findTopByOrder_OrderIdAndStatusInOrderByPaymentDateDesc(Integer orderId, List<PaymentStatus> statuses);
}