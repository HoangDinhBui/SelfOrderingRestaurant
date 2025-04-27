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
import com.example.SelfOrderingRestaurant.Enum.TableStatus;
import com.example.SelfOrderingRestaurant.Exception.AuthorizationException;
import com.example.SelfOrderingRestaurant.Exception.ResourceNotFoundException;
import com.example.SelfOrderingRestaurant.Exception.ValidationException;
import com.example.SelfOrderingRestaurant.Repository.*;
import com.example.SelfOrderingRestaurant.Security.SecurityUtils;
import com.example.SelfOrderingRestaurant.Service.Imp.IOrderService;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.servlet.http.HttpServletRequest;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;

@AllArgsConstructor
@Service
public class OrderService implements IOrderService {

    private final OrderRepository orderRepository;

    private final OrderItemRepository orderItemRepository;

    private final DishRepository dishRepository;

    private final DinningTableRepository dinningTableRepository;

    private final CustomerRepository customerRepository;

    private final OrderCartService orderCartService;

    private final HttpServletRequest httpServletRequest;

    private final SecurityUtils securityUtils;


    private static Logger log = org.slf4j.LoggerFactory.getLogger(OrderService.class);

    @Transactional
    @Override
    public Integer createOrder(OrderRequestDTO request) {
        // Validate input data
        validateOrderRequest(request);

        // Check if table exists and is available
        DinningTable dinningTable = dinningTableRepository.findById(request.getTableId())
                .orElseThrow(() -> new ResourceNotFoundException("Table not found with ID: " + request.getTableId()));

        // Check table status
        if (TableStatus.OCCUPIED.equals(dinningTable.getTableStatus())) {
            throw new ValidationException("Table is already occupied");
        }

        // Get or create customer
        Customer customer = getOrCreateCustomer(request);

        // Create order
        Order order = new Order();
        order.setCustomer(customer);
        order.setTables(dinningTable);
        order.setStatus(OrderStatus.PENDING);
        order.setPaymentStatus(PaymentStatus.UNPAID);
        order.setNotes(request.getNotes());
        order.setOrderDate(new Date());

        order = orderRepository.save(order);
        Integer orderId = order.getOrderId();
        log.info("Created new order with ID: {}", orderId);

        // Process order items and calculate total
        BigDecimal totalAmount = processOrderItems(order, request.getItems());

        // Update order with calculated total amount
        order.setTotalAmount(totalAmount);
        orderRepository.save(order);

        // Update table status to OCCUPIED
        dinningTable.setTableStatus(TableStatus.OCCUPIED);
        dinningTableRepository.save(dinningTable);
        log.info("Updated table {} status to OCCUPIED", dinningTable.getTableNumber());

        // Clear the cart after creating the order
        orderCartService.clearCart();

        return orderId;
    }

    private void validateOrderRequest(OrderRequestDTO request) {
        List<String> errors = new ArrayList<>();

        // Validate table_id
        if (request.getTableId() == null || request.getTableId() <= 0) {
            errors.add("Table ID must be a positive integer");
        }

        // Validate items
        if (request.getItems() == null || request.getItems().isEmpty()) {
            errors.add("Order must contain at least one item");
        } else {
            // Validate each item
            for (int i = 0; i < request.getItems().size(); i++) {
                OrderItemDTO item = request.getItems().get(i);
                if (item.getDishId() == null || item.getDishId() <= 0) {
                    errors.add("Item #" + (i+1) + ": Dish ID must be a positive integer");
                } else {
                    // Check if dish exists
                    boolean dishExists = dishRepository.existsById(item.getDishId());
                    if (!dishExists) {
                        errors.add("Item #" + (i+1) + ": Dish with ID " + item.getDishId() + " does not exist");
                    }
                }

                if (item.getQuantity() <= 0) {
                    errors.add("Item #" + (i+1) + ": Quantity must be a positive integer");
                }

                // Notes validation (optional)
                if (item.getNotes() != null && item.getNotes().length() > 255) {
                    errors.add("Item #" + (i+1) + ": Notes must not exceed 255 characters");
                }
            }
        }

        if (!errors.isEmpty()) {
            throw new ValidationException("Invalid order request: " + String.join(", ", errors));
        }
    }

    private Customer getOrCreateCustomer(OrderRequestDTO request) {
        Customer customer;
        if (request.getCustomerId() != null) {
            customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + request.getCustomerId()));
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
            log.info("Created new temporary customer with name: {}", guestName);
        }
        return customer;
    }

    private BigDecimal processOrderItems(Order order, List<OrderItemDTO> itemRequests) {
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (OrderItemDTO itemRequest : itemRequests) {
            Dish dish = dishRepository.findById(itemRequest.getDishId())
                    .orElseThrow(() -> new ResourceNotFoundException("Dish not found with ID: " + itemRequest.getDishId()));

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
            log.debug("Added item: {} x{} to order {}", dish.getName(), itemRequest.getQuantity(), order.getOrderId());
        }

        return totalAmount;
    }

    @Override
    public List<GetAllOrdersResponseDTO> getAllOrders() {
        // Check authorization (optional based on your requirements)
        if (!securityUtils.isAuthenticated()) {
            throw new AuthorizationException("Authentication required to view orders");
        }

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

    @Override
    public OrderResponseDTO getOrderById(Integer orderId) {
        if (orderId == null || orderId <= 0) {
            throw new ValidationException("Order ID must be a positive integer");
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId));

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
    @Override
    public void updateOrderStatus(Integer orderId, String status) {
        // Check authorization
        if (!securityUtils.isAuthenticated() && securityUtils.hasRole("STAFF")) {
            throw new AuthorizationException("Only staff members can update order status");
        }

        if (orderId == null || orderId <= 0) {
            throw new ValidationException("Order ID must be a positive integer");
        }

        if (status == null || status.trim().isEmpty()) {
            throw new ValidationException("Status cannot be empty");
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId));

        try {
            OrderStatus newStatus = OrderStatus.valueOf(status.toUpperCase());
            OrderStatus oldStatus = order.getStatus();

            order.setStatus(newStatus);
            orderRepository.save(order);

            log.info("Updated order {} status from {} to {}", orderId, oldStatus, newStatus);

            // If order is completed or canceled, update table status if needed
            if (newStatus == OrderStatus.COMPLETED || newStatus == OrderStatus.CANCELLED) {
                DinningTable table = order.getTables();
                if (TableStatus.OCCUPIED.name().equals(table.getTableStatus())) {
                    // Check if there are other active orders for this table
                    long activeOrderCount = orderRepository.countActiveOrdersByTableId(table.getTableNumber());

                    if (activeOrderCount == 0) {
                        table.setTableStatus(TableStatus.AVAILABLE);
                        dinningTableRepository.save(table);
                        log.info("Updated table {} status to AVAILABLE", table.getTableNumber());
                    }
                }
            }
        } catch (IllegalArgumentException e) {
            throw new ValidationException("Invalid order status: " + status);
        }
    }

    // Cart management methods
    @Override
    public OrderCartResponseDTO addDishToOrderCart(OrderItemDTO orderItemDTO) {
        // Validate dish ID
        if (orderItemDTO.getDishId() == null || orderItemDTO.getDishId() <= 0) {
            throw new ValidationException("Dish ID must be a positive integer");
        }

        // Check if dish exists
        boolean dishExists = dishRepository.existsById(orderItemDTO.getDishId());
        if (!dishExists) {
            throw new ResourceNotFoundException("Dish not found with ID: " + orderItemDTO.getDishId());
        }

        // Validate quantity
        if (orderItemDTO.getQuantity() <= 0) {
            throw new ValidationException("Quantity must be a positive integer");
        }

        return orderCartService.addItem(orderItemDTO);
    }

    @Override
    public OrderCartResponseDTO getCurrentOrderCart() {
        return orderCartService.getCart();
    }

    @Override
    public OrderCartResponseDTO removeItemFromCart(Integer dishId) {
        if (dishId == null || dishId <= 0) {
            throw new ValidationException("Dish ID must be a positive integer");
        }

        return orderCartService.removeItem(dishId);
    }

    @Override
    public OrderCartResponseDTO updateItemQuantity(Integer dishId, int quantity) {
        if (dishId == null || dishId <= 0) {
            throw new ValidationException("Dish ID must be a positive integer");
        }

        if (quantity <= 0) {
            throw new ValidationException("Quantity must be a positive integer");
        }

        return orderCartService.updateItemQuantity(dishId, quantity);
    }

    @Override
    public OrderCartResponseDTO updateItemNotes(Integer dishId, String notes) {
        if (dishId == null || dishId <= 0) {
            throw new ValidationException("Dish ID must be a positive integer");
        }

        if (notes != null && notes.length() > 255) {
            throw new ValidationException("Notes must not exceed 255 characters");
        }

        log.info("Updating notes for dish ID {}: {}", dishId, notes);

        // Get current cart
        OrderCartResponseDTO currentCart = getCurrentOrderCart();

        if (currentCart == null || currentCart.getItems() == null) {
            throw new IllegalStateException("Cart not found or empty");
        }

        // Find the item and update its notes
        boolean itemFound = false;
        for (OrderCartResponseDTO.CartItemDTO item : currentCart.getItems()) {
            if (item.getDishId().equals(dishId)) {
                item.setNotes(notes);
                itemFound = true;
                updateOrderItemInDatabase(dishId, notes);
                break;
            }
        }

        if (!itemFound) {
            log.warn("Item with ID {} not found in cart", dishId);
            throw new ResourceNotFoundException("Item not found in cart with ID: " + dishId);
        }

        return currentCart;
    }

    private void updateOrderItemInDatabase(Integer dishId, String notes) {
        HttpSession session = httpServletRequest.getSession();
        Integer orderId = (Integer) session.getAttribute("currentOrderId");

        // Update in database
        if (orderId != null) {
            orderItemRepository.updateNotes(orderId, dishId, notes);
            log.debug("Updated notes for dish {} in order {}", dishId, orderId);
        } else {
            log.warn("Cannot update notes in database: No current order ID found in session");
        }
    }
}