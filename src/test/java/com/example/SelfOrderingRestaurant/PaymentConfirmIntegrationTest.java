package com.example.SelfOrderingRestaurant;

import com.example.SelfOrderingRestaurant.Controller.PaymentController;
import com.example.SelfOrderingRestaurant.Entity.*;
import com.example.SelfOrderingRestaurant.Enum.*;
import com.example.SelfOrderingRestaurant.Repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class PaymentConfirmIntegrationTest {

    @Autowired
    private PaymentController paymentController;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private DinningTableRepository tableRepository;

    private DinningTable table;

    @BeforeEach
    public void setup() {
        table = new DinningTable();
        table.setTableNumber(7);
        table.setTableStatus(TableStatus.OCCUPIED);
        table.setCapacity(4);
        tableRepository.save(table);
    }

    private Order order(OrderStatus status, PaymentStatus paymentStatus) {
        Order order = new Order();
        order.setTables(table);
        order.setOrderDate(new Date());
        order.setTotalAmount(BigDecimal.valueOf(80000));
        order.setStatus(status);
        order.setPaymentStatus(paymentStatus);
        return orderRepository.save(order);
    }

    private void unpaidPayment(Order order) {
        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setAmount(order.getTotalAmount());
        payment.setPaymentMethod(PaymentMethod.CASH);
        payment.setStatus(PaymentStatus.UNPAID);
        payment.setTransactionId("T" + order.getOrderId());
        payment.setPaymentDate(LocalDateTime.now());
        paymentRepository.save(payment);
    }

    @Test
    @WithMockUser(username = "staff", roles = {"STAFF"})
    public void confirmFreesTableEvenWhenAnEarlierOrderWasCancelled() {
        // A cancelled order never gets paid, so it stays UNPAID forever
        order(OrderStatus.CANCELLED, PaymentStatus.UNPAID);
        Order current = order(OrderStatus.COMPLETED, PaymentStatus.UNPAID);
        unpaidPayment(current);

        paymentController.confirmPayment(Map.of("orderId", current.getOrderId()));

        assertEquals(PaymentStatus.PAID, orderRepository.findById(current.getOrderId()).orElseThrow().getPaymentStatus());
        assertEquals(TableStatus.AVAILABLE, tableRepository.findById(table.getTableNumber()).orElseThrow().getTableStatus());
    }

    @Test
    @WithMockUser(username = "staff", roles = {"STAFF"})
    public void confirmKeepsTableOccupiedWhileAnotherOrderIsUnpaid() {
        order(OrderStatus.PROCESSING, PaymentStatus.UNPAID);
        Order current = order(OrderStatus.COMPLETED, PaymentStatus.UNPAID);
        unpaidPayment(current);

        paymentController.confirmPayment(Map.of("orderId", current.getOrderId()));

        assertEquals(TableStatus.OCCUPIED, tableRepository.findById(table.getTableNumber()).orElseThrow().getTableStatus());
    }

    @Test
    public void cancelledOrdersAreNotActive() {
        order(OrderStatus.CANCELLED, PaymentStatus.UNPAID);
        order(OrderStatus.COMPLETED, PaymentStatus.PAID);

        assertEquals(0, orderRepository.countActiveOrdersByTableId(table.getTableNumber()));
    }
}
