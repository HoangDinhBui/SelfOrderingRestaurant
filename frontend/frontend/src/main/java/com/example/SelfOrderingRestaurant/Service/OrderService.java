package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Request.OrderRequestDTO.OrderItemDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.OrderRequestDTO.OrderRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.OrderResponseDTO.GetAllOrdersResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.OrderResponseDTO.OrderResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.OrderResponseDTO.OrderCartResponseDTO;
import com.example.SelfOrderingRestaurant.Entity.*;
import com.example.SelfOrderingRestaurant.Entity.DinningTable;
import com.example.SelfOrderingRestaurant.Enum.OrderStatus;
import com.example.SelfOrderingRestaurant.Enum.PaymentStatus;
import com.example.SelfOrderingRestaurant.Entity.Key.OrderItemKey;
import com.example.SelfOrderingRestaurant.Repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.annotation.SessionScope;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
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
    @Autowired
    private OrderCartService orderCartService;

    @Transactional
    public Integer createOrder(OrderRequestDTO request) {
        DinningTable dinningTable = dinningTableRepository.findById(request.getTableId())
                .orElseThrow(() -> new IllegalArgumentException("Table not found"));

        Customer customer;
        if (request.getCustomerId() != null) {
            customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new IllegalArgumentException("Customer not found"));
        } else {
            // Create a temporary customer for walk-in orders
            customer = new Customer();
            String guestName = request.getCustomerName();
            if (guestName == null || guestName.trim().isEmpty()) {
                // Create a timestamp-based unique ID for the guest
                String uniqueId = String.valueOf(System.currentTimeMillis());
                guestName = "Guest_" + uniqueId;
            }
            customer.setFullname(guestName);
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
        Integer orderId = order.getOrderId();
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

            OrderItemDTO orderItemDTO = new OrderItemDTO();
            orderItemDTO.setDishId(dish.getDishId());
            orderItemDTO.setQuantity(itemRequest.getQuantity());
            orderItemDTO.setNotes(itemRequest.getNotes());
            orderItemDTO.setDishName(dish.getName());
            orderItemDTO.setPrice(dish.getPrice());

            orderItemDTOs.add(orderItemDTO);
        }
        order.setTotalAmount(totalAmount);
        orderRepository.save(order);

        // Clear the cart after creating the order
        orderCartService.clearCart();

        return orderId;
    }

    public List<GetAllOrdersResponseDTO> getAllOrders() {
        List<Order> orders = orderRepository.findAll();

        return orders.stream().map(order -> {
            List<OrderItem> orderItems = orderItemRepository.findByOrder(order);

            List<OrderItemDTO> items = orderItems.stream()
                    .map(item -> {
                        OrderItemDTO dto = new OrderItemDTO();
                        dto.setDishId(item.getId().getDishId());
                        dto.setQuantity(item.getQuantity());
                        dto.setNotes(item.getNotes());
                        dto.setDishName(item.getDish().getName());
                        dto.setPrice(item.getDish().getPrice());
                        return dto;
                    }).collect(Collectors.toList());

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
                .map(item -> {
                    OrderItemDTO dto = new OrderItemDTO();
                    dto.setDishId(item.getId().getDishId());
                    dto.setQuantity(item.getQuantity());
                    dto.setNotes(item.getNotes());
                    dto.setDishName(item.getDish().getName());
                    dto.setPrice(item.getDish().getPrice());
                    return dto;
                }).collect(Collectors.toList());

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

    // Cart management methods
    public OrderCartResponseDTO addDishToOrderCart(OrderItemDTO orderItemDTO) {
        return orderCartService.addItem(orderItemDTO);
    }

    public OrderCartResponseDTO getCurrentOrderCart() {
        return orderCartService.getCart();
    }

    public OrderCartResponseDTO removeItemFromCart(Integer dishId) {
        return orderCartService.removeItem(dishId);
    }

    public OrderCartResponseDTO updateItemQuantity(Integer dishId, int quantity) {
        return orderCartService.updateItemQuantity(dishId, quantity);
    }
}