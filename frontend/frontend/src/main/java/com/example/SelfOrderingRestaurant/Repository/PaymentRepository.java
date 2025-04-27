package com.example.SelfOrderingRestaurant.Repository;

import com.example.SelfOrderingRestaurant.Entity.Order;
import com.example.SelfOrderingRestaurant.Entity.Payment;
import com.example.SelfOrderingRestaurant.Enum.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {
    Payment findByTransactionId(String transactionId);
    Payment findByOrder_OrderId(Integer orderId);
    List<Payment> findByOrderAndStatus(Order order, PaymentStatus status);
    Optional<Payment> findTopByOrderAndStatusOrderByPaymentDateDesc(Order order, PaymentStatus status);
    Optional<Payment> findTopByOrder_OrderIdAndStatusOrderByPaymentDateDesc(Integer orderId, PaymentStatus status);
}