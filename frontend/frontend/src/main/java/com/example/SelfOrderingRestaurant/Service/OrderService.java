package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Request.OrderRequestDTO.OrderItemDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.OrderRequestDTO.OrderRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.OrderResponseDTO.GetAllOrdersResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.OrderResponseDTO.OrderResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.OrderResponseDTO.OrderCartResponseDTO;
import com.example.SelfOrderingRestaurant.Entity.*;
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
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.servlet.http.HttpServletRequest;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

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

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    @Autowired
    public OrderService(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            DishRepository dishRepository,
            DinningTableRepository dinningTableRepository,
            CustomerRepository customerRepository,
            OrderCartService orderCartService,
            HttpServletRequest httpServletRequest,
            SecurityUtils securityUtils) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.dishRepository = dishRepository;
        this.dinningTableRepository = dinningTableRepository;
        this.customerRepository = customerRepository;
        this.orderCartService = orderCartService;
        this.httpServletRequest = httpServletRequest;
        this.securityUtils = securityUtils;
    }

    @Transactional
    @Override
    public Integer createOrder(OrderRequestDTO request) {
        validateOrderRequest(request);

        DinningTable dinningTable = dinningTableRepository.findById(request.getTableId())
                .orElseThrow(() -> new ResourceNotFoundException("Table not found with ID: " + request.getTableId()));

        // Kiểm tra xem bàn đã có order chưa thanh toán hay chưa
        List<Order> existingOrders = orderRepository.findByTableNumberAndPaymentStatus(
                dinningTable.getTableNumber(), PaymentStatus.UNPAID);

        Order order;
        if (!existingOrders.isEmpty()) {
            // Nếu có order chưa thanh toán, sử dụng order đầu tiên
            order = existingOrders.get(0);
            log.info("Found existing unpaid order with ID: {} for table {}", order.getOrderId(), dinningTable.getTableNumber());

            // Cập nhật ghi chú nếu có
            if (request.getNotes() != null && !request.getNotes().isEmpty()) {
                order.setNotes(request.getNotes());
            }
        } else {
            // Nếu không có order chưa thanh toán, tạo order mới
            if (TableStatus.OCCUPIED.equals(dinningTable.getTableStatus())) {
                throw new ValidationException("Table is already occupied");
            }

            Customer customer = getOrCreateCustomer(request);

            order = new Order();
            order.setCustomer(customer);
            order.setTables(dinningTable);
            order.setStatus(OrderStatus.PENDING);
            order.setPaymentStatus(PaymentStatus.UNPAID);
            order.setNotes(request.getNotes());
            order.setOrderDate(new Date());

            order = orderRepository.save(order);
            dinningTable.setTableStatus(TableStatus.OCCUPIED);
            dinningTableRepository.save(dinningTable);
            log.info("Created new order with ID: {} for table {}", order.getOrderId(), dinningTable.getTableNumber());
        }

        // Xử lý các món trong order
        BigDecimal additionalAmount = processOrderItems(order, request.getItems());
        BigDecimal newTotalAmount = order.getTotalAmount() != null
                ? order.getTotalAmount().add(additionalAmount)
                : additionalAmount;

        order.setTotalAmount(newTotalAmount);
        orderRepository.save(order);

        orderCartService.clearCart();

        return order.getOrderId();
    }

    private void validateOrderRequest(OrderRequestDTO request) {
        List<String> errors = new ArrayList<>();

        if (request.getTableId() == null || request.getTableId() <= 0) {
            errors.add("Table ID must be a positive integer");
        }

        if (request.getItems() == null || request.getItems().isEmpty()) {
            errors.add("Order must contain at least one item");
        } else {
            for (int i = 0; i < request.getItems().size(); i++) {
                OrderItemDTO item = request.getItems().get(i);
                if (item.getDishId() == null || item.getDishId() <= 0) {
                    errors.add("Item #" + (i+1) + ": Dish ID must be a positive integer");
                } else {
                    boolean dishExists = dishRepository.existsById(item.getDishId());
                    if (!dishExists) {
                        errors.add("Item #" + (i+1) + ": Dish with ID " + item.getDishId() + " does not exist");
                    }
                }

                if (item.getQuantity() <= 0) {
                    errors.add("Item #" + (i+1) + ": Quantity must be a positive integer");
                }

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
            customer = new Customer();
            String guestName = request.getCustomerName();
            if (guestName == null || guestName.trim().isEmpty()) {
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
        try {
            log.info("Fetching all unpaid orders");

            List<Order> orders = orderRepository.findByPaymentStatus(PaymentStatus.UNPAID);
            log.info("Retrieved {} unpaid orders", orders.size());

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
        } catch (Exception e) {
            log.error("Error fetching unpaid orders: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to fetch unpaid orders: " + e.getMessage());
        }
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

            if (newStatus == OrderStatus.COMPLETED || newStatus == OrderStatus.CANCELLED) {
                DinningTable table = order.getTables();
                if (TableStatus.OCCUPIED.equals(table.getTableStatus())) {
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

    @Transactional
    public OrderResponseDTO removeOrderItem(Integer orderId, Integer dishId) {
        if (!securityUtils.isAuthenticated() && securityUtils.hasRole("STAFF")) {
            throw new AuthorizationException("Only staff members can remove order items");
        }

        if (orderId == null || orderId <= 0) {
            throw new ValidationException("Order ID must be a positive integer");
        }

        if (dishId == null || dishId <= 0) {
            throw new ValidationException("Dish ID must be a positive integer");
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId));

        OrderItemKey key = new OrderItemKey();
        key.setOrderId(orderId);
        key.setDishId(dishId);

        OrderItem orderItem = orderItemRepository.findById(key)
                .orElseThrow(() -> new ResourceNotFoundException("Order item not found for order ID: " + orderId + " and dish ID: " + dishId));

        orderItemRepository.delete(orderItem);
        log.info("Removed item with dish ID {} from order {}", dishId, orderId);

        // Recalculate total amount
        List<OrderItem> remainingItems = orderItemRepository.findByOrder(order);
        BigDecimal totalAmount = remainingItems.stream()
                .map(item -> item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        order.setTotalAmount(totalAmount);
        orderRepository.save(order);

        // Return updated order
        List<OrderItemDTO> items = remainingItems.stream()
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

    @Override
    public OrderCartResponseDTO addDishToOrderCart(OrderItemDTO orderItemDTO) {
        if (orderItemDTO.getDishId() == null || orderItemDTO.getDishId() <= 0) {
            throw new ValidationException("Dish ID must be a positive integer");
        }

        boolean dishExists = dishRepository.existsById(orderItemDTO.getDishId());
        if (!dishExists) {
            throw new ResourceNotFoundException("Dish not found with ID: " + orderItemDTO.getDishId());
        }

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

        OrderCartResponseDTO currentCart = getCurrentOrderCart();

        if (currentCart == null || currentCart.getItems() == null) {
            throw new IllegalStateException("Cart not found or empty");
        }

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

        if (orderId != null) {
            orderItemRepository.updateNotes(orderId, dishId, notes);
            log.debug("Updated notes for dish {} in order {}", dishId, orderId);
        } else {
            log.warn("Cannot update notes in database: No current order ID found in session");
        }
    }
}