package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Dto.Request.OrderRequestDTO.OrderItemDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.OrderRequestDTO.OrderRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.OrderResponseDTO.GetAllOrdersResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.OrderResponseDTO.OrderCartResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.OrderResponseDTO.OrderResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.OrderRequestDTO.UpdateOrderStatusRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.PaymentResponseDTO.OrderPaymentDetailsDTO;
import com.example.SelfOrderingRestaurant.Service.OrderService;
import com.example.SelfOrderingRestaurant.Service.PaymentService;
import jakarta.annotation.security.PermitAll;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@PermitAll
public class OrderController {
    Logger log = LoggerFactory.getLogger(OrderController.class);

    @Autowired
    OrderService orderService;
    @Autowired
    PaymentService paymentService;

    @PostMapping("/orders")
    public ResponseEntity<?> createOrder(@RequestBody OrderRequestDTO orderDTO) {
        Integer orderId = orderService.createOrder(orderDTO);
        return ResponseEntity.ok(Map.of("orderId", orderId, "message", "Create Order successfully!"));
    }

    @GetMapping("/orders")
    public ResponseEntity<?> getOrders() {
        List<GetAllOrdersResponseDTO> orders = orderService.getAllOrders();
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/orders/{orderId}")
    public ResponseEntity<?> getOrderById(@PathVariable Integer orderId) {
        OrderResponseDTO order = orderService.getOrderById(orderId);
        return ResponseEntity.ok(order);
    }

    @GetMapping("/orders/{orderId}/payment")
    public ResponseEntity<?> getOrderPaymentDetails(@PathVariable Integer orderId) {
        if (orderId == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("No order ID provided");
        }

        try {
            OrderResponseDTO order = orderService.getOrderById(orderId);
            if (order == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Order not found with ID: " + orderId);
            }
            // Fetch order payment details including total, items, and payment status
            OrderPaymentDetailsDTO paymentDetails = paymentService.getOrderPaymentDetails(orderId);
            return ResponseEntity.ok(paymentDetails);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Order not found with ID: " + orderId);
        } catch (Exception e) {
            log.error("Error fetching payment details for order {}: {}", orderId, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to retrieve payment details: " + e.getMessage());
        }
    }

    @PutMapping("/staff/orders/{orderId}/status")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable Integer orderId,
            @RequestBody UpdateOrderStatusRequestDTO request) {
        orderService.updateOrderStatus(orderId, request.getStatus());
        return ResponseEntity.ok("Order updated successfully!");
    }

    // New endpoint to add dish to order cart
    @PostMapping("/orders/cart/add")
    public ResponseEntity<?> addDishToOrderCart(@RequestBody OrderItemDTO orderItemDTO) {
        OrderCartResponseDTO cart = orderService.addDishToOrderCart(orderItemDTO);
        return ResponseEntity.ok(cart);
    }

    // New endpoint to get current order cart
    @GetMapping("/orders/cart")
    public ResponseEntity<?> getOrderCart() {
        OrderCartResponseDTO cart = orderService.getCurrentOrderCart();
        return ResponseEntity.ok(cart);
    }

    // New endpoint to remove item from order cart
    @DeleteMapping("/orders/cart/items/{dishId}")
    public ResponseEntity<?> removeItemFromCart(@PathVariable Integer dishId) {
        OrderCartResponseDTO cart = orderService.removeItemFromCart(dishId);
        return ResponseEntity.ok(cart);
    }

    // New endpoint to update item quantity in order cart
    @PutMapping("/orders/cart/items/{dishId}")
    public ResponseEntity<?> updateItemQuantity(
            @PathVariable Integer dishId,
            @RequestParam int quantity) {
        OrderCartResponseDTO cart = orderService.updateItemQuantity(dishId, quantity);
        return ResponseEntity.ok(cart);
    }
}