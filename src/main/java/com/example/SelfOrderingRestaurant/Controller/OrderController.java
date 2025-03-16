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

    @GetMapping("/GetOrders")
    public List<GetAllOrdersResponseDTO> getOrders() {
        return orderService.getAllOrders();
    }

    @PutMapping("/UpdateOrderStatus/{orderId}")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestBody UpdateOrderStatusRequestDTO request) {
        try {
            orderService.updateOrderStatus(orderId, request.getStatus());
            return ResponseEntity.ok("Order updated successfully!");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi cập nhật trạng thái đơn hàng: " + e.getMessage());
        }
    }
}
