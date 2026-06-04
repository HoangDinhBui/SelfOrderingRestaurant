package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Dto.Request.OrderRequestDTO.OrderRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.OrderResponseDTO.OrderResponseDTO;
import com.example.SelfOrderingRestaurant.Service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.validation.annotation.Validated;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    @Autowired
    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<Integer> createOrder(@Validated @RequestBody OrderRequestDTO orderRequestDTO) {
        Integer orderId = orderService.createOrder(orderRequestDTO);
        return ResponseEntity.ok(orderId);
    }

    @DeleteMapping("/{orderId}/items/{dishId}")
    public ResponseEntity<OrderResponseDTO> removeOrderItem(
            @PathVariable Integer orderId,
            @PathVariable Integer dishId) {
        return ResponseEntity.ok(orderService.removeOrderItem(orderId, dishId));
    }
}
