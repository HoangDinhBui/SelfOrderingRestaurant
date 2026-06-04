package com.example.SelfOrderingRestaurant;

import com.example.SelfOrderingRestaurant.Controller.OrderController;
import com.example.SelfOrderingRestaurant.Dto.Response.OrderResponseDTO.OrderResponseDTO;
import com.example.SelfOrderingRestaurant.Entity.*;
import com.example.SelfOrderingRestaurant.Entity.Key.OrderItemKey;
import com.example.SelfOrderingRestaurant.Enum.*;
import com.example.SelfOrderingRestaurant.Repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class OrderCancelIntegrationTest {

    @Autowired
    private OrderController orderController;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private DinningTableRepository tableRepository;

    @Autowired
    private DishRepository dishRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private CustomerRepository customerRepository;

    private DinningTable table;
    private Dish dish1;
    private Dish dish2;

    @BeforeEach
    public void setup() {
        table = new DinningTable();
        table.setTableNumber(5);
        table.setTableStatus(TableStatus.AVAILABLE);
        table.setCapacity(4);
        tableRepository.save(table);

        dish1 = new Dish();
        dish1.setName("Phở Bò");
        dish1.setPrice(BigDecimal.valueOf(50000));
        dish1.setStatus(DishStatus.AVAILABLE);
        dishRepository.save(dish1);
        
        dish2 = new Dish();
        dish2.setName("Cafe Sữa");
        dish2.setPrice(BigDecimal.valueOf(30000));
        dish2.setStatus(DishStatus.AVAILABLE);
        dishRepository.save(dish2);
    }

    @Test
    @WithMockUser(username = "testcustomer", roles = {"CUSTOMER"})
    public void testRemovePendingOrderItem_AsCustomer() {
        Customer customer = new Customer();
        customer.setFullname("Test Customer");
        customer.setPoints(0);
        customerRepository.save(customer);

        // 1. Setup Order
        Order order = new Order();
        order.setCustomer(customer);
        order.setTables(table);
        order.setOrderDate(new Date());
        order.setTotalAmount(BigDecimal.valueOf(80000));
        order.setStatus(OrderStatus.PENDING);
        order.setPaymentStatus(PaymentStatus.UNPAID);
        orderRepository.save(order);

        // 2. Setup Order Items
        OrderItem item1 = new OrderItem();
        item1.setId(new OrderItemKey(order.getOrderId(), dish1.getDishId()));
        item1.setOrder(order);
        item1.setDish(dish1);
        item1.setQuantity(1);
        item1.setUnitPrice(dish1.getPrice());
        item1.setStatus(OrderItemStatus.PENDING);
        orderItemRepository.save(item1);

        OrderItem item2 = new OrderItem();
        item2.setId(new OrderItemKey(order.getOrderId(), dish2.getDishId()));
        item2.setOrder(order);
        item2.setDish(dish2);
        item2.setQuantity(1);
        item2.setUnitPrice(dish2.getPrice());
        item2.setStatus(OrderItemStatus.PROCESSING); // Can't be cancelled
        orderItemRepository.save(item2);

        // 3. Test remove pending item (dish1)
        ResponseEntity<OrderResponseDTO> response = orderController.removeOrderItem(order.getOrderId(), dish1.getDishId());
        
        assertNotNull(response);
        assertEquals(200, response.getStatusCodeValue());
        
        // 4. Verify in DB
        OrderItem updatedItem1 = orderItemRepository.findById(new OrderItemKey(order.getOrderId(), dish1.getDishId())).orElse(null);
        assertNotNull(updatedItem1);
        assertEquals(OrderItemStatus.CANCELLED, updatedItem1.getStatus());

        // Verify total amount recalculated (only dish2 price)
        Order updatedOrder = orderRepository.findById(order.getOrderId()).orElse(null);
        assertNotNull(updatedOrder);
        assertEquals(0, BigDecimal.valueOf(30000).compareTo(updatedOrder.getTotalAmount()));

        // 5. Test removing processing item (should fail)
        try {
            orderController.removeOrderItem(order.getOrderId(), dish2.getDishId());
            fail("Should have thrown exception");
        } catch (Exception e) {
            assertTrue(e.getMessage().contains("Can only cancel PENDING items") || 
                       e.getCause().getMessage().contains("Can only cancel PENDING items"));
        }
    }
}
