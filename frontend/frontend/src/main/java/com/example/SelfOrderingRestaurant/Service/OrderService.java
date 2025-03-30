package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Request.OrderRequestDTO.OrderItemDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.OrderRequestDTO.OrderRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.OrderResponseDTO.GetAllOrdersResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.OrderResponseDTO.OrderResponseDTO;
import com.example.SelfOrderingRestaurant.Entity.*;
import com.example.SelfOrderingRestaurant.Entity.DinningTable;
import com.example.SelfOrderingRestaurant.Enum.OrderStatus;
import com.example.SelfOrderingRestaurant.Enum.PaymentStatus;
import com.example.SelfOrderingRestaurant.Entity.Key.OrderItemKey;
import com.example.SelfOrderingRestaurant.Repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderService {
    @Autowired
    private OrderRepository orderRepository;
    @Autowired
    private OrderItemRepository orderItemRepository;
    @Autowired
    private DishRepository dishRepository;
    @Autowired
    private DinningTableRepository dinningTableRepository;
    @Autowired
    private CustomerRepository customerRepository;

    @Transactional
    public void createOrder(OrderRequestDTO request) {
        DinningTable dinningTable = dinningTableRepository.findById(request.getTableId())
                .orElseThrow(() -> new IllegalArgumentException("Table not found"));

        Customer customer;
        if (request.getCustomerId() != null) {
            customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new IllegalArgumentException("Customer not found"));
        } else {
            // Create a temporary customer for walk-in orders
            customer = new Customer();
            customer.setFullname(request.getCustomerName() != null ?
                    request.getCustomerName() : "Walk-in Customer");
            customer.setJoinDate(new Date());
            customer.setPoints(0);
            customer = customerRepository.save(customer);
        }

        Order order = new Order();
        order.setCustomer(customer);
        order.setTables(dinningTable);
        order.setStatus(OrderStatus.PENDING);
        order.setPaymentStatus(PaymentStatus.UNPAID);
        order.setNotes(request.getNotes());
        order.setOrderDate(new Date());

        order = orderRepository.save(order);
        System.out.println("Saved order ID: " + order.getOrderId());

        List<OrderItemDTO> orderItemDTOs = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (OrderItemDTO itemRequest : request.getItems()) {
            Dish dish = dishRepository.findById(itemRequest.getDishId())
                    .orElseThrow(() -> new IllegalArgumentException("Dish not found"));

            BigDecimal subTotal = dish.getPrice().multiply(BigDecimal.valueOf(itemRequest.getQuantity()));
            totalAmount = totalAmount.add(subTotal);

            OrderItemKey orderItemKey = new OrderItemKey();
            orderItemKey.setOrderId(order.getOrderId());
            orderItemKey.setDishId(dish.getDishId());

            OrderItem orderItem = new OrderItem();
            orderItem.setId(orderItemKey);
            orderItem.setOrder(order);
            orderItem.setDish(dish);
            orderItem.setQuantity(itemRequest.getQuantity());
            orderItem.setUnitPrice(dish.getPrice());
            orderItem.setNotes(itemRequest.getNotes());

            orderItemRepository.save(orderItem);

            OrderItemDTO orderItemDTO = new OrderItemDTO(dish.getDishId(), itemRequest.getQuantity(), itemRequest.getNotes());
            orderItemDTOs.add(orderItemDTO);
        }
        order.setTotalAmount(totalAmount);
        orderRepository.save(order);
    }

    public List<GetAllOrdersResponseDTO> getAllOrders() {
        List<Order> orders = orderRepository.findAll();

        return orders.stream().map(order -> {
            List<OrderItem> orderItems = orderItemRepository.findByOrder(order);

            List<OrderItemDTO> items = orderItems.stream()
                    .map(item -> new OrderItemDTO(
                            item.getId().getDishId(),
                            item.getQuantity(),
                            item.getNotes()
                    )).collect(Collectors.toList());

            return new GetAllOrdersResponseDTO(
                    order.getOrderId(),
                    order.getCustomer().getFullname(),
                    order.getTables().getTableNumber(),
                    order.getStatus().name(),
                    order.getTotalAmount(),
                    order.getPaymentStatus().name(),
                    items
            );
        }).collect(Collectors.toList());
    }

    public OrderResponseDTO getOrderById(Integer orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        List<OrderItem> orderItems = orderItemRepository.findByOrder(order);

        List<OrderItemDTO> items = orderItems.stream()
                .map(item -> new OrderItemDTO(
                        item.getId().getDishId(),
                        item.getQuantity(),
                        item.getNotes()
                )).collect(Collectors.toList());

        return new OrderResponseDTO(
                order.getOrderId(),
                order.getCustomer().getFullname(),
                order.getTables().getTableNumber(),
                order.getStatus().name(),
                order.getTotalAmount(),
                order.getPaymentStatus().name(),
                items
        );
    }

    @Transactional
    public void updateOrderStatus(Integer orderId, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        try {
            OrderStatus newStatus = OrderStatus.valueOf(status.toUpperCase());
            order.setStatus(newStatus);
            orderRepository.save(order);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid order status: " + status);
        }
    }
}
