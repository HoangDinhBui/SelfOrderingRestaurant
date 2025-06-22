package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Request.OrderRequestDTO.OrderItemDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.OrderRequestDTO.OrderRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.NotificationResponseDTO.NotificationResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.OrderResponseDTO.GetAllOrdersResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.OrderResponseDTO.OrderResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.OrderResponseDTO.OrderCartResponseDTO;
import com.example.SelfOrderingRestaurant.Entity.*;
import com.example.SelfOrderingRestaurant.Enum.*;
import com.example.SelfOrderingRestaurant.Entity.Key.OrderItemKey;
import com.example.SelfOrderingRestaurant.Exception.AuthorizationException;
import com.example.SelfOrderingRestaurant.Exception.ResourceNotFoundException;
import com.example.SelfOrderingRestaurant.Exception.ValidationException;
import com.example.SelfOrderingRestaurant.Repository.*;
import com.example.SelfOrderingRestaurant.Security.SecurityUtils;
import com.example.SelfOrderingRestaurant.Service.Imp.IOrderService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.servlet.http.HttpServletRequest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
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
    private final WebSocketService webSocketService;
    private final StaffShiftRepository staffShiftRepository;

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
            SecurityUtils securityUtils,
            WebSocketService webSocketService, StaffShiftRepository staffShiftRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.dishRepository = dishRepository;
        this.dinningTableRepository = dinningTableRepository;
        this.customerRepository = customerRepository;
        this.orderCartService = orderCartService;
        this.httpServletRequest = httpServletRequest;
        this.securityUtils = securityUtils;
        this.webSocketService = webSocketService;
        this.staffShiftRepository = staffShiftRepository;
    }

    @Transactional
    @Override
    public Integer createOrder(OrderRequestDTO request) {
        List<Staff> staffOnShift = staffShiftRepository.findStaffOnCurrentShift(LocalDate.now(), LocalTime.now());
        if (staffOnShift.isEmpty()) {
            log.error("Cannot create order: No staff is currently on shift");
            throw new ValidationException("Cannot create order: No staff is currently on shift");
        }
        validateOrderRequest(request);

        DinningTable dinningTable = dinningTableRepository.findById(request.getTableId())
                .orElseThrow(() -> new ResourceNotFoundException("Table not found with ID: " + request.getTableId()));

        if (TableStatus.OCCUPIED.equals(dinningTable.getTableStatus())) {
            List<Order> existingOrders = orderRepository.findByTableNumberAndPaymentStatus(
                    dinningTable.getTableNumber(), PaymentStatus.UNPAID);
            if (!existingOrders.isEmpty()) {
                Integer orderId = existingOrders.get(0).getOrderId();
                log.info("Found existing unpaid order with ID: {} for table {}, redirecting to updateOrder", orderId, dinningTable.getTableNumber());
                return updateOrder(orderId, request);
            }
        }

        Customer customer = getOrCreateCustomer(request);

        Order newOrder = new Order();
        newOrder.setCustomer(customer);
        newOrder.setTables(dinningTable);
        newOrder.setStatus(OrderStatus.PENDING);
        newOrder.setPaymentStatus(PaymentStatus.UNPAID);
        newOrder.setNotes(request.getNotes());
        newOrder.setOrderDate(new Date());

        Order order = orderRepository.save(newOrder); // Save order to generate orderId
        log.info("Created new order with ID: {} for table {}", order.getOrderId(), dinningTable.getTableNumber());

        // Add items to new order
        List<OrderItem> orderItems = new ArrayList<>();
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            for (OrderItemDTO itemDTO : request.getItems()) {
                // Validate dish exists
                Dish dish = dishRepository.findById(itemDTO.getDishId())
                        .orElseThrow(() -> new ResourceNotFoundException("Dish not found with ID: " + itemDTO.getDishId()));

                if (itemDTO.getQuantity() <= 0) {
                    throw new ValidationException("Quantity must be positive for dish ID: " + itemDTO.getDishId());
                }

                log.info("Adding new dish ID: {} with quantity: {} to order {}",
                        itemDTO.getDishId(), itemDTO.getQuantity(), order.getOrderId());

                OrderItem orderItem = new OrderItem();
                orderItem.setId(new OrderItemKey(order.getOrderId(), itemDTO.getDishId()));
                orderItem.setOrder(order);
                orderItem.setDish(dish);
                orderItem.setQuantity(itemDTO.getQuantity());
                orderItem.setUnitPrice(dish.getPrice());
                orderItem.setNotes(itemDTO.getNotes());
                orderItem.setStatus(OrderItemStatus.PENDING);
                orderItems.add(orderItem);
            }
            orderItemRepository.saveAll(orderItems);
        }

        // Calculate total amount for all items
        BigDecimal totalAmount = calculateTotalAmount(order);
        order.setTotalAmount(totalAmount);
        orderRepository.save(order);
        log.info("Set total amount for order {} to {}", order.getOrderId(), totalAmount);

        dinningTable.setTableStatus(TableStatus.OCCUPIED);
        dinningTableRepository.save(dinningTable);

        orderCartService.clearCart();

        sendOrderNotification(order, dinningTable);

        return order.getOrderId();
    }

    @Transactional
    public Integer updateOrder(Integer orderId, OrderRequestDTO request) {
        validateOrderRequest(request);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId));

        if (!order.getPaymentStatus().equals(PaymentStatus.UNPAID)) {
            throw new ValidationException("Cannot update paid order with ID: " + orderId);
        }

        DinningTable dinningTable = order.getTables();
        log.info("Updating order with ID: {} for table {}", order.getOrderId(), dinningTable.getTableNumber());

        // Update notes if provided
        if (request.getNotes() != null && !request.getNotes().isEmpty()) {
            order.setNotes(request.getNotes());
        }

        // Process items for existing order
        List<OrderItem> existingItems = orderItemRepository.findByOrderOrderId(order.getOrderId());
        log.info("Fetched {} items for order ID: {}", existingItems != null ? existingItems.size() : 0, order.getOrderId());
        if (existingItems == null) {
            existingItems = new ArrayList<>();
        }

        if (request.getItems() != null && !request.getItems().isEmpty()) {
            for (OrderItemDTO itemDTO : request.getItems()) {
                // Validate dish exists
                Dish dish = dishRepository.findById(itemDTO.getDishId())
                        .orElseThrow(() -> new ResourceNotFoundException("Dish not found with ID: " + itemDTO.getDishId()));

                if (itemDTO.getQuantity() <= 0) {
                    throw new ValidationException("Quantity must be positive for dish ID: " + itemDTO.getDishId());
                }

                log.info("Processing dish ID: {} with quantity: {}", itemDTO.getDishId(), itemDTO.getQuantity());

                // Check if item already exists in the order
                Optional<OrderItem> existingItem = existingItems.stream()
                        .filter(item -> item.getDish().getDishId().equals(itemDTO.getDishId()))
                        .findFirst();

                if (existingItem.isPresent()) {
                    // Update quantity for existing item
                    OrderItem item = existingItem.get();
                    int newQuantity = item.getQuantity() + itemDTO.getQuantity();
                    item.setQuantity(newQuantity);
                    item.setNotes(itemDTO.getNotes());
                    orderItemRepository.save(item);
                    log.info("Updated quantity for dish ID: {} in order {}, new quantity: {}",
                            item.getDish().getDishId(), order.getOrderId(), newQuantity);
                } else {
                    // Add new item
                    OrderItem newItem = new OrderItem();
                    newItem.setId(new OrderItemKey(order.getOrderId(), itemDTO.getDishId()));
                    newItem.setOrder(order);
                    newItem.setDish(dish);
                    newItem.setQuantity(itemDTO.getQuantity());
                    newItem.setUnitPrice(dish.getPrice());
                    newItem.setNotes(itemDTO.getNotes());
                    newItem.setStatus(OrderItemStatus.PENDING);
                    existingItems.add(newItem);
                    log.info("Added new dish ID: {} to order {}", itemDTO.getDishId(), order.getOrderId());
                }
            }
            orderItemRepository.saveAll(existingItems);
        }

        // Calculate total amount for all items
        BigDecimal totalAmount = calculateTotalAmount(order);
        order.setTotalAmount(totalAmount);
        orderRepository.save(order);
        log.info("Set total amount for order {} to {}", order.getOrderId(), totalAmount);

        orderCartService.clearCart();

        sendOrderNotification(order, dinningTable);

        return order.getOrderId();
    }

    private BigDecimal calculateTotalAmount(Order order) {
        List<OrderItem> orderItems = orderItemRepository.findByOrderOrderId(order.getOrderId());
        if (orderItems == null || orderItems.isEmpty()) {
            return BigDecimal.ZERO;
        }

        BigDecimal totalAmount = orderItems.stream()
                .filter(item -> item.getStatus() != OrderItemStatus.CANCELLED)
                .filter(item -> item.getUnitPrice() != null && item.getQuantity() > 0)
                .map(item -> {
                    BigDecimal price = item.getUnitPrice();
                    int quantity = item.getQuantity();
                    BigDecimal subTotal = price.multiply(BigDecimal.valueOf(quantity));
                    log.debug("Calculating for item: dishId={}, price={}, quantity={}, subTotal={}",
                            item.getId().getDishId(), price, quantity, subTotal);
                    return subTotal;
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        log.info("Calculated total amount for order {}: {}", order.getOrderId(), totalAmount);
        return totalAmount;
    }

    private BigDecimal processOrderItems(Order order, List<OrderItemDTO> itemRequests) {
        BigDecimal totalAmount = BigDecimal.ZERO;

        if (itemRequests == null || itemRequests.isEmpty()) {
            return totalAmount;
        }

        for (OrderItemDTO itemRequest : itemRequests) {
            Dish dish = dishRepository.findById(itemRequest.getDishId())
                    .orElseThrow(() -> new ResourceNotFoundException("Dish not found with ID: " + itemRequest.getDishId()));

            if (dish.getPrice() == null) {
                log.warn("Price for dish ID {} is null", itemRequest.getDishId());
                throw new ValidationException("Price for dish ID " + itemRequest.getDishId() + " is null");
            }

            BigDecimal subTotal = dish.getPrice().multiply(BigDecimal.valueOf(itemRequest.getQuantity()));
            totalAmount = totalAmount.add(subTotal);
            log.debug("Calculated subtotal for dish {}: {} x {} = {}",
                    dish.getName(), itemRequest.getQuantity(), dish.getPrice(), subTotal);
        }

        return totalAmount;
    }

    private void sendOrderNotification(Order order, DinningTable dinningTable) {
        Map<String, Object> message = new HashMap<>();
        message.put("type", "NEW_ORDER");
        Map<String, Object> orderDetails = new HashMap<>();
        orderDetails.put("orderId", order.getOrderId());
        orderDetails.put("tableNumber", dinningTable.getTableNumber());
        orderDetails.put("paymentStatus", order.getPaymentStatus().name());
        orderDetails.put("totalAmount", order.getTotalAmount());
        orderDetails.put("status", order.getStatus().name());
        orderDetails.put("customerName", order.getCustomer().getFullname());
        message.put("order", orderDetails);

        webSocketService.sendNotificationToActiveStaff(new NotificationResponseDTO() {
            @Override
            public Integer getNotificationId() { return null; }
            @Override
            public String getTitle() { return null; }
            @Override
            public String getContent() { return null; }
            @Override
            public Boolean getIsRead() { return null; }
            @Override
            public NotificationType getType() { return null; }
            @Override
            public LocalDateTime getCreateAt() { return null; }
            @Override
            public Integer getTableNumber() { return dinningTable.getTableNumber(); }
            @Override
            public Integer getOrderId() { return order.getOrderId(); }

            @Override
            public String toJson() {
                try {
                    return new ObjectMapper().writeValueAsString(message);
                } catch (Exception e) {
                    log.error("Error serializing order message: {}", e.getMessage());
                    return "{}";
                }
            }
        });
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

    @Override
    public List<GetAllOrdersResponseDTO> getAllOrders() {
        try {
            log.info("Fetching all unpaid orders");

            List<Order> orders = orderRepository.findAll();
            log.info("Retrieved {} unpaid orders", orders.size());

            return orders.stream()
                    .filter(order -> order.getTables() != null)
                    .map(order -> {
                        List<OrderItem> orderItems = orderItemRepository.findByOrder(order);

                        List<OrderItemDTO> items = orderItems.stream()
                                .map(item -> {
                                    OrderItemDTO dto = new OrderItemDTO();
                                    dto.setDishId(item.getId().getDishId());
                                    dto.setQuantity(item.getQuantity());
                                    dto.setNotes(item.getNotes());
                                    dto.setDishName(item.getDish().getName());
                                    dto.setPrice(item.getDish().getPrice());
                                    dto.setStatus(item.getStatus() != null ? item.getStatus().name() : OrderItemStatus.PENDING.name());
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
                    dto.setStatus(item.getStatus() != null ? item.getStatus().name() : OrderItemStatus.PENDING.name());
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
        if (!securityUtils.isAuthenticated() || !securityUtils.hasRole("STAFF")) {
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

        if (orderItem.getStatus() != OrderItemStatus.PENDING) {
            throw new ValidationException("Can only cancel PENDING items");
        }

        orderItem.setStatus(OrderItemStatus.CANCELLED);
        orderItemRepository.save(orderItem);
        log.info("Cancelled item with dish ID {} from order {}", dishId, orderId);

        // Recalculate total amount (exclude CANCELLED items)
        BigDecimal totalAmount = calculateTotalAmount(order);
        order.setTotalAmount(totalAmount);
        orderRepository.save(order);
        log.info("Updated total amount for order {} to {}", orderId, totalAmount);

        // Check if all items are CANCELLED or COMPLETED
        List<OrderItem> remainingItems = orderItemRepository.findByOrder(order);
        boolean allItemsDone = remainingItems.stream()
                .allMatch(item -> item.getStatus() == OrderItemStatus.COMPLETED || item.getStatus() == OrderItemStatus.CANCELLED);

        if (allItemsDone) {
            DinningTable table = order.getTables();
            if (TableStatus.OCCUPIED.equals(table.getTableStatus())) {
                table.setTableStatus(TableStatus.AVAILABLE);
                dinningTableRepository.save(table);
                log.info("Updated table {} status to AVAILABLE", table.getTableNumber());
            }
        }

        // Return updated order
        List<OrderItemDTO> items = remainingItems.stream()
                .map(item -> {
                    OrderItemDTO dto = new OrderItemDTO();
                    dto.setDishId(item.getId().getDishId());
                    dto.setQuantity(item.getQuantity());
                    dto.setNotes(item.getNotes());
                    dto.setDishName(item.getDish().getName());
                    dto.setPrice(item.getDish().getPrice());
                    dto.setStatus(item.getStatus() != null ? item.getStatus().name() : OrderItemStatus.PENDING.name());
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

        HttpSession session = httpServletRequest.getSession();
        Integer orderId = (Integer) session.getAttribute("currentOrderId");

        if (orderId != null) {
            OrderItemKey key = new OrderItemKey();
            key.setOrderId(orderId);
            key.setDishId(dishId);

            OrderItem orderItem = orderItemRepository.findById(key)
                    .orElseThrow(() -> new ResourceNotFoundException("Order item not found for dish ID: " + dishId));

            if (orderItem.getStatus() != OrderItemStatus.PENDING) {
                throw new ValidationException("Can only modify quantity for PENDING items");
            }

            orderItem.setQuantity(quantity);
            orderItemRepository.save(orderItem);
            log.info("Updated quantity for dish {} in order {} to {}", dishId, orderId, quantity);
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

    @Transactional
    @Override
    public OrderResponseDTO updateOrderItemStatus(Integer orderId, Integer dishId, String status) {
        if (!securityUtils.isAuthenticated() || !securityUtils.hasRole("STAFF")) {
            throw new AuthorizationException("Only staff members can update order item status");
        }

        if (orderId == null || orderId <= 0) {
            throw new ValidationException("Order ID must be a positive integer");
        }

        if (dishId == null || dishId <= 0) {
            throw new ValidationException("Dish ID must be a positive integer");
        }

        if (status == null || status.trim().isEmpty()) {
            throw new ValidationException("Status cannot be empty");
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId));

        OrderItemKey key = new OrderItemKey();
        key.setOrderId(orderId);
        key.setDishId(dishId);

        OrderItem orderItem = orderItemRepository.findById(key)
                .orElseThrow(() -> new ResourceNotFoundException("Order item not found for order ID: " + orderId + " and dish ID: " + dishId));

        try {
            OrderItemStatus newStatus = OrderItemStatus.valueOf(status.toUpperCase());
            if (!isValidStatusTransition(orderItem.getStatus(), newStatus)) {
                throw new ValidationException("Invalid status transition from " + orderItem.getStatus() + " to " + newStatus);
            }

            // Log current state
            log.info("Before updating item status for order {}, dish {}: status={}, totalAmount={}",
                    orderId, dishId, orderItem.getStatus(), order.getTotalAmount());

            orderItem.setStatus(newStatus);
            orderItemRepository.save(orderItem);
            log.info("Updated order item status for order {}, dish {} to {}", orderId, dishId, newStatus);

            // Recalculate total amount
            BigDecimal totalAmount = calculateTotalAmount(order);
            order.setTotalAmount(totalAmount);
            orderRepository.save(order);
            log.info("Updated total amount for order {} to {}", orderId, totalAmount);

            // Update table status if all items are COMPLETED or CANCELLED
            List<OrderItem> orderItems = orderItemRepository.findByOrder(order);
            boolean allItemsDone = orderItems.stream()
                    .allMatch(item -> item.getStatus() == OrderItemStatus.COMPLETED || item.getStatus() == OrderItemStatus.CANCELLED);
            log.info("All items done for order {}: {}", orderId, allItemsDone);

            if (allItemsDone) {
                DinningTable table = order.getTables();
                if (TableStatus.OCCUPIED.equals(table.getTableStatus())) {
                    table.setTableStatus(TableStatus.AVAILABLE);
                    dinningTableRepository.save(table);
                    log.info("Updated table {} status to AVAILABLE", table.getTableNumber());
                }
            }

            // Return updated order
            List<OrderItemDTO> items = orderItems.stream()
                    .map(item -> {
                        OrderItemDTO dto = new OrderItemDTO();
                        dto.setDishId(item.getId().getDishId());
                        dto.setQuantity(item.getQuantity());
                        dto.setNotes(item.getNotes());
                        dto.setDishName(item.getDish().getName());
                        dto.setPrice(item.getDish().getPrice());
                        dto.setStatus(item.getStatus() != null ? item.getStatus().name() : OrderItemStatus.PENDING.name());
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
        } catch (IllegalArgumentException e) {
            throw new ValidationException("Invalid order item status: " + status);
        }
    }

    private boolean isValidStatusTransition(OrderItemStatus currentStatus, OrderItemStatus newStatus) {
        if (currentStatus == OrderItemStatus.PENDING) {
            return newStatus == OrderItemStatus.PROCESSING || newStatus == OrderItemStatus.CANCELLED;
        } else if (currentStatus == OrderItemStatus.PROCESSING) {
            return newStatus == OrderItemStatus.COMPLETED || newStatus == OrderItemStatus.CANCELLED;
        }
        return false;
    }
}