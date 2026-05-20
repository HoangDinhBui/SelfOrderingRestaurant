package com.example.SelfOrderingRestaurant;

import com.example.SelfOrderingRestaurant.Dto.Request.PaymentRequestDTO.ProcessPaymentRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.UserRequestDTO.CustomerRegisterRequestDto;
import com.example.SelfOrderingRestaurant.Dto.Request.UserRequestDTO.LoginRequestDto;
import com.example.SelfOrderingRestaurant.Dto.Response.OrderResponseDTO.OrderResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.UserResponseDTO.AuthResponseDto;
import com.example.SelfOrderingRestaurant.Entity.*;
import com.example.SelfOrderingRestaurant.Enum.*;
import com.example.SelfOrderingRestaurant.Repository.*;
import com.example.SelfOrderingRestaurant.Service.AuthService;
import com.example.SelfOrderingRestaurant.Service.OrderService;
import com.example.SelfOrderingRestaurant.Service.PaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class CustomerPointsAndHistoryIntegrationTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private OrderService orderService;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DinningTableRepository tableRepository;

    @Autowired
    private DishRepository dishRepository;

    private DinningTable table;
    private Dish dish;

    @BeforeEach
    public void setup() {
        // Setup table
        table = new DinningTable();
        table.setTableNumber(5);
        table.setTableStatus(TableStatus.AVAILABLE);
        table.setCapacity(4);
        tableRepository.save(table);

        // Setup dish
        dish = new Dish();
        dish.setName("Phở Bò");
        dish.setPrice(BigDecimal.valueOf(100000));
        dish.setStatus(DishStatus.AVAILABLE);
        dishRepository.save(dish);
    }

    @Test
    public void testCustomerPointsAndOrderHistoryLifecycle() {
        // 1. Register a new Customer
        CustomerRegisterRequestDto registerDto = new CustomerRegisterRequestDto();
        registerDto.setUsername("testcustomer");
        registerDto.setPassword("password123");
        registerDto.setEmail("testcustomer@gmail.com");
        registerDto.setPhone("0987654321");
        registerDto.setFullname("Bùi Đình Hoàng");

        AuthResponseDto registerResponse = authService.registerCustomer(registerDto);
        assertNotNull(registerResponse);
        assertNotNull(registerResponse.getCustomerId());
        assertEquals("Bùi Đình Hoàng", registerResponse.getFullname());
        assertEquals(0, registerResponse.getPoints());

        // 2. Fetch Customer from DB
        Customer customer = customerRepository.findById(registerResponse.getCustomerId()).orElse(null);
        assertNotNull(customer);
        assertEquals(0, customer.getPoints());
        assertNotNull(customer.getUser());

        // 3. Create an Order of 250,000 VND
        Order order = new Order();
        order.setCustomer(customer);
        order.setTables(table);
        order.setOrderDate(new Date());
        order.setTotalAmount(BigDecimal.valueOf(250000));
        order.setStatus(OrderStatus.PENDING);
        order.setPaymentStatus(PaymentStatus.UNPAID);
        orderRepository.save(order);

        // 4. Pay the order (250,000 VND) and verify points are accumulated
        // Since paid amount is 250,000: points earned = (250000 / 100000) * 1000 = 2000 points.
        paymentService.finalizePoints(order, BigDecimal.valueOf(250000));

        Customer updatedCustomer = customerRepository.findById(customer.getCustomerId()).orElse(null);
        assertNotNull(updatedCustomer);
        assertEquals(2000, updatedCustomer.getPoints());

        // 5. Create a second order of 150,000 VND
        Order order2 = new Order();
        order2.setCustomer(updatedCustomer);
        order2.setTables(table);
        order2.setOrderDate(new Date());
        order2.setTotalAmount(BigDecimal.valueOf(150000));
        order2.setStatus(OrderStatus.PENDING);
        order2.setPaymentStatus(PaymentStatus.UNPAID);
        orderRepository.save(order2);

        // Apply a points discount of 1,000 points (which equals 1,000 VND)
        paymentService.applyPointsDiscount(order2.getOrderId(), 1000);

        Order order2FromDb = orderRepository.findById(order2.getOrderId()).orElse(null);
        assertNotNull(order2FromDb);
        assertEquals(0, BigDecimal.valueOf(1000).compareTo(order2FromDb.getDiscount()));

        // Finalize points for second payment
        // Redeemed: 1,000 points. Cash paid: 150,000 - 1,000 = 149,000 VND.
        // Points earned from cash: (149000 / 100000) * 1000 = 1000 points.
        // Final points balance: 2,000 - 1,000 (redeemed) + 1,000 (earned) = 2,000 points.
        paymentService.finalizePoints(order2FromDb, BigDecimal.valueOf(149000));

        Customer finalCustomer = customerRepository.findById(customer.getCustomerId()).orElse(null);
        assertNotNull(finalCustomer);
        assertEquals(2000, finalCustomer.getPoints());

        // 6. Test getting order history
        List<OrderResponseDTO> history = orderService.getCustomerOrderHistory("testcustomer");
        assertNotNull(history);
        assertEquals(2, history.size());

        // The history is sorted by order date descending, so order2 should be first or second depending on timestamps.
        // Let's verify both orders exist in the history.
        boolean foundOrder1 = false;
        boolean foundOrder2 = false;
        for (OrderResponseDTO dto : history) {
            if (dto.getOrderId().equals(order.getOrderId())) {
                foundOrder1 = true;
                assertEquals(0, BigDecimal.valueOf(250000).compareTo(dto.getTotalAmount()));
            } else if (dto.getOrderId().equals(order2.getOrderId())) {
                foundOrder2 = true;
                assertEquals(0, BigDecimal.valueOf(150000).compareTo(dto.getTotalAmount()));
            }
        }
        assertTrue(foundOrder1);
        assertTrue(foundOrder2);
    }
}
