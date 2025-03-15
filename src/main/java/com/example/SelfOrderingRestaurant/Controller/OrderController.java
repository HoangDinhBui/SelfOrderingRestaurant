package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Dto.OrderRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.OrderResponseDTO;
import com.example.SelfOrderingRestaurant.Service.OrderService;
import jakarta.annotation.security.PermitAll;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/order")
@RequiredArgsConstructor
@PermitAll
public class OrderController {
    @Autowired
    OrderService orderService;

    @PostMapping("/CreateOrders")
    public ResponseEntity<?> createOrder(@RequestBody OrderRequestDTO orderDTO) {
        try {
            System.out.println("Received OrderDTO: " + orderDTO);
            return ResponseEntity.ok(orderService.createOrder(orderDTO));
        } catch (Exception e) {
            e.printStackTrace(); // In lỗi chi tiết trong IntelliJ
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi xử lý đơn hàng: " + e.getMessage());
        }
    }
}
