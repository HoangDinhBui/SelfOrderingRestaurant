package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Dto.Request.DishRequestDTO.DishRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.DishResponseDTO.GetAllDishesResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.OrderResponseDTO.GetAllOrdersResponseDTO;
import com.example.SelfOrderingRestaurant.Entity.Dish;
import com.example.SelfOrderingRestaurant.Service.DishService;
import jakarta.annotation.security.PermitAll;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dishes")
@RequiredArgsConstructor
@PermitAll
public class DishController {
    @Autowired
    DishService dishService;

    @PostMapping("/CreateDishes")
    public ResponseEntity<?> createDish(@RequestBody DishRequestDTO dishDTO) {
        try {
            System.out.println("Received DishDTO: " + dishDTO);
            return ResponseEntity.ok(dishService.createDish(dishDTO));
        } catch (Exception e) {
            e.printStackTrace(); // In lỗi chi tiết trong IntelliJ
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi xử lý đơn hàng: " + e.getMessage());
        }
    }

    @GetMapping("/dishes")
    public ResponseEntity<?> getDishes() {
        List<GetAllDishesResponseDTO> dishes = dishService.getAllDishes();
        return ResponseEntity.ok(dishes);
    }
}
