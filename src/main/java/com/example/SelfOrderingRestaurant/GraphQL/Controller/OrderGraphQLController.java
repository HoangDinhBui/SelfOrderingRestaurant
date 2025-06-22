package com.example.SelfOrderingRestaurant.GraphQL.Controller;

import com.example.SelfOrderingRestaurant.Dto.Request.OrderRequestDTO.OrderItemDTO;
import com.example.SelfOrderingRestaurant.GraphQL.Input.UpdateItemNotesInput;
import com.example.SelfOrderingRestaurant.GraphQL.Input.UpdateOrderStatusInput;
import com.example.SelfOrderingRestaurant.GraphQL.Input.OrderItemInput;
import com.example.SelfOrderingRestaurant.GraphQL.Input.OrderInput;
import com.example.SelfOrderingRestaurant.Dto.Request.OrderRequestDTO.OrderRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.OrderRequestDTO.UpdateOrderStatusRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.OrderResponseDTO.GetAllOrdersResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.OrderResponseDTO.OrderCartResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.OrderResponseDTO.OrderResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.PaymentResponseDTO.OrderPaymentDetailsDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.PaymentResponseDTO.PaymentNotificationStatusDTO;
import com.example.SelfOrderingRestaurant.Service.OrderService;
import com.example.SelfOrderingRestaurant.Service.PaymentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.stream.Collectors;

@Controller
public class OrderGraphQLController {
    private static final Logger log = LoggerFactory.getLogger(OrderGraphQLController.class);

    private final OrderService orderService;
    private final PaymentService paymentService;

    @Autowired
    public OrderGraphQLController(OrderService orderService, PaymentService paymentService) {
        this.orderService = orderService;
        this.paymentService = paymentService;
    }

    // Query Resolvers
    @QueryMapping
    public List<GetAllOrdersResponseDTO> orders() {
        try {
            log.info("Executing orders query");
            List<GetAllOrdersResponseDTO> orders = orderService.getAllOrders();
            log.info("Retrieved {} orders", orders.size());
            return orders;
        } catch (Exception e) {
            log.error("Error in orders query: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to fetch orders: " + e.getMessage());
        }
    }

    @QueryMapping
    public OrderResponseDTO order(@Argument String orderId) {
        try {
            log.info("Fetching order {}", orderId);
            return orderService.getOrderById(Integer.valueOf(orderId));
        } catch (Exception e) {
            log.error("Error fetching order {}: {}", orderId, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch order: " + e.getMessage());
        }
    }

    @QueryMapping
    public OrderCartResponseDTO orderCart() {
        try {
            log.info("Fetching order cart");
            return orderService.getCurrentOrderCart();
        } catch (Exception e) {
            log.error("Error fetching order cart: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to fetch order cart: " + e.getMessage());
        }
    }

    @QueryMapping
    public OrderPaymentDetailsDTO orderPaymentDetails(@Argument String orderId) {
        try {
            log.info("Fetching payment details for order {}", orderId);
            return paymentService.getOrderPaymentDetails(Integer.valueOf(orderId));
        } catch (Exception e) {
            log.error("Error fetching payment details for order {}: {}", orderId, e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve payment details: " + e.getMessage());
        }
    }

    @QueryMapping
    public PaymentNotificationStatusDTO paymentNotificationStatus(@Argument String orderId) {
        try {
            log.info("Checking payment notification status for order {}", orderId);
            return paymentService.checkPaymentNotificationStatus(Integer.valueOf(orderId));
        } catch (Exception e) {
            log.error("Error checking payment notification status for order {}: {}", orderId, e.getMessage(), e);
            throw new RuntimeException("Failed to check payment notification status: " + e.getMessage());
        }
    }

    @QueryMapping
    public TableValidationResponse validateTableNumber(@Argument String orderId, @Argument int tableNumber) {
        try {
            log.info("Validating table number {} for order {}", tableNumber, orderId);
            OrderResponseDTO order = orderService.getOrderById(Integer.valueOf(orderId));

            if (order.getPaymentStatus().equals("PAID")) {
                log.warn("Order {} is already paid", orderId);
                return new TableValidationResponse(false, null, "Order has already been paid");
            }

            if (order.getTableNumber() == tableNumber) {
                log.info("Table number {} is valid for order {}", tableNumber, orderId);
                return new TableValidationResponse(true, null, null);
            } else {
                log.info("Table number {} is invalid for order {}; correct table number is {}",
                        tableNumber, orderId, order.getTableNumber());
                return new TableValidationResponse(false, order.getTableNumber(), null);
            }
        } catch (Exception e) {
            log.error("Error validating table number for order {}: {}", orderId, e.getMessage(), e);
            return new TableValidationResponse(false, null, "Order not found or invalid");
        }
    }

    // Mutation Resolvers
    @MutationMapping
    public Integer createOrder(@Argument OrderInput input) {
        try {
            log.info("Creating order with input: {}", input);
            OrderRequestDTO orderDTO = convertOrderInputToDTO(input);
            Integer orderId = orderService.createOrder(orderDTO);
            log.info("Created order with ID: {}", orderId);
            return orderId;
        } catch (Exception e) {
            log.error("Error creating order: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create order: " + e.getMessage());
        }
    }

    @MutationMapping
    public String updateOrderStatus(@Argument String orderId, @Argument UpdateOrderStatusInput input) {
        try {
            log.info("Updating status for order {} to {}", orderId, input.getStatus());
            UpdateOrderStatusRequestDTO requestDTO = new UpdateOrderStatusRequestDTO();
            requestDTO.setStatus(input.getStatus());
            orderService.updateOrderStatus(Integer.valueOf(orderId), requestDTO.getStatus());
            log.info("Updated order {} status", orderId);
            return "Order updated successfully!";
        } catch (Exception e) {
            log.error("Error updating order status for {}: {}", orderId, e.getMessage(), e);
            throw new RuntimeException("Failed to update order status: " + e.getMessage());
        }
    }

    @MutationMapping
    public OrderCartResponseDTO addDishToOrderCart(@Argument OrderItemInput input) {
        try {
            log.info("Adding dish to order cart: {}", input);
            OrderItemDTO itemDTO = new OrderItemDTO();
            itemDTO.setDishId(Integer.valueOf(input.getDishId()));
            itemDTO.setQuantity(input.getQuantity());
            itemDTO.setNotes(input.getNotes());
            OrderCartResponseDTO result = orderService.addDishToOrderCart(itemDTO);
            log.info("Added dish to order cart");
            return result;
        } catch (Exception e) {
            log.error("Error adding dish to order cart: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to add dish to order cart: " + e.getMessage());
        }
    }

    @MutationMapping
    public OrderCartResponseDTO removeItemFromCart(@Argument String dishId) {
        try {
            log.info("Removing item {} from cart", dishId);
            OrderCartResponseDTO result = orderService.removeItemFromCart(Integer.valueOf(dishId));
            log.info("Removed item {} from cart", dishId);
            return result;
        } catch (Exception e) {
            log.error("Error removing item {} from cart: {}", dishId, e.getMessage(), e);
            throw new RuntimeException("Failed to remove item from cart: " + e.getMessage());
        }
    }

    @MutationMapping
    public OrderCartResponseDTO updateItemQuantity(@Argument String dishId, @Argument int quantity) {
        try {
            log.info("Updating quantity for dish {} to {}", dishId, quantity);
            OrderCartResponseDTO result = orderService.updateItemQuantity(Integer.valueOf(dishId), quantity);
            log.info("Updated quantity for dish {}", dishId);
            return result;
        } catch (Exception e) {
            log.error("Error updating quantity for dish {}: {}", dishId, e.getMessage(), e);
            throw new RuntimeException("Failed to update item quantity: " + e.getMessage());
        }
    }

    @MutationMapping
    public OrderCartResponseDTO updateItemNotes(@Argument String dishId, @Argument UpdateItemNotesInput input) {
        try {
            log.info("Updating notes for dish {}: {}", dishId, input.getNotes());
            OrderCartResponseDTO result = orderService.updateItemNotes(Integer.valueOf(dishId), input.getNotes());
            log.info("Updated notes for dish {}", dishId);
            return result;
        } catch (Exception e) {
            log.error("Error updating notes for dish {}: {}", dishId, e.getMessage(), e);
            throw new RuntimeException("Failed to update notes: " + e.getMessage());
        }
    }

    @MutationMapping
    public OrderResponseDTO removeOrderItem(@Argument String orderId, @Argument String dishId) {
        try {
            log.info("Removing item {} from order {}", dishId, orderId);
            OrderResponseDTO result = orderService.removeOrderItem(Integer.valueOf(orderId), Integer.valueOf(dishId));
            log.info("Removed item {} from order {}", dishId, orderId);
            return result;
        } catch (Exception e) {
            log.error("Error removing item {} from order {}: {}", dishId, orderId, e.getMessage(), e);
            throw new RuntimeException("Failed to remove item: " + e.getMessage());
        }
    }

    @MutationMapping
    public OrderResponseDTO updateOrderItemStatus(@Argument String orderId, @Argument String dishId, @Argument String status) {
        try {
            log.info("Updating status for order item: order {}, dish {}, status {}", orderId, dishId, status);
            OrderResponseDTO result = orderService.updateOrderItemStatus(Integer.valueOf(orderId), Integer.valueOf(dishId), status);
            log.info("Updated order item status for order {}, dish {}", orderId, dishId);
            return result;
        } catch (Exception e) {
            log.error("Error updating order item status for order {}, dish {}: {}", orderId, dishId, e.getMessage(), e);
            throw new RuntimeException("Failed to update order item status: " + e.getMessage());
        }
    }

    // Helper methods
    private OrderRequestDTO convertOrderInputToDTO(OrderInput input) {
        OrderRequestDTO orderDTO = new OrderRequestDTO();
        orderDTO.setCustomerId(input.getCustomerId() != null ? Integer.valueOf(input.getCustomerId()) : null);
        orderDTO.setCustomerName(input.getCustomerName());
        orderDTO.setTableId(Integer.valueOf(input.getTableId()));
        orderDTO.setNotes(input.getNotes());

        List<OrderItemDTO> items = input.getItems().stream()
                .map(item -> {
                    OrderItemDTO itemDTO = new OrderItemDTO();
                    itemDTO.setDishId(Integer.valueOf(item.getDishId()));
                    itemDTO.setQuantity(item.getQuantity());
                    itemDTO.setNotes(item.getNotes());
                    return itemDTO;
                })
                .collect(Collectors.toList());

        orderDTO.setItems(items);
        return orderDTO;
    }

    public static class TableValidationResponse {
        private final boolean isValid;
        private final Integer correctTableNumber;
        private final String error;

        public TableValidationResponse(boolean isValid, Integer correctTableNumber, String error) {
            this.isValid = isValid;
            this.correctTableNumber = correctTableNumber;
            this.error = error;
        }

        public boolean getIsValid() {
            return isValid;
        }

        public Integer getCorrectTableNumber() {
            return correctTableNumber;
        }

        public String getError() {
            return error;
        }
    }
}