package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Dto.Request.OrderRequestDTO.OrderRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.OrderResponseDTO.GetAllOrdersResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.OrderResponseDTO.OrderResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.OrderRequestDTO.UpdateOrderStatusRequestDTO;
import com.example.SelfOrderingRestaurant.Service.OrderService;
import jakarta.annotation.security.PermitAll;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/order")
@RequiredArgsConstructor
@PermitAll
public class OrderController {
    @Autowired
    OrderService orderService;

    @PostMapping("/orders")
    public ResponseEntity<?> createOrder(@RequestBody OrderRequestDTO orderDTO) {
        orderService.createOrder(orderDTO);
        return ResponseEntity.ok("Create Order successfully!");
    }

    @GetMapping("/orders")
    public ResponseEntity<?> getOrders() {
        List<GetAllOrdersResponseDTO> orders = orderService.getAllOrders();
        return ResponseEntity.ok(orders);
    }

    @PutMapping("/orders/{orderId}")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestBody UpdateOrderStatusRequestDTO request) {
        orderService.updateOrderStatus(orderId, request.getStatus());
        return ResponseEntity.ok("Order updated successfully!");
    }
}