package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Dto.Request.DishRequestDTO.DishRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.DishResponseDTO.DishResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.DishResponseDTO.GetAllDishesResponseDTO;
import com.example.SelfOrderingRestaurant.Service.DishService;
import jakarta.annotation.security.PermitAll;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173/")
@RequiredArgsConstructor
@PermitAll
public class DishController {

    private final DishService dishService;

    @PostMapping(path = "/admin/dishes", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createDish(@Valid @ModelAttribute DishRequestDTO dishDTO, Authentication authentication) {
        dishService.createDish(dishDTO, authentication);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Thêm món ăn thành công!");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/dishes")
    public ResponseEntity<List<GetAllDishesResponseDTO>> getDishes() {
        List<GetAllDishesResponseDTO> dishes = dishService.getAllDishes();
        String baseUrl = "http://localhost:8080/uploads/";
        dishes.forEach(dish -> {
            if (dish.getImageUrl() != null) {
                dish.setImageUrl(baseUrl + dish.getImageUrl());
            }
        });
        return ResponseEntity.ok(dishes);
    }

    @GetMapping("/dishes/{dishId}")
    public ResponseEntity<?> getDishById(@PathVariable Integer dishId) {
        try {
            DishResponseDTO dish = dishService.getDishById(dishId);
            if (dish.getImageUrl() != null) {
                dish.setImageUrl("http://localhost:8080/uploads/" + dish.getImageUrl());
            }
            return ResponseEntity.ok(dish);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    @PostMapping(value = "/dishes/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateDish(
            @PathVariable Integer id,
            @ModelAttribute DishRequestDTO request,
            Authentication authentication
    ) {
        dishService.updateDish(id, request, authentication);
        return ResponseEntity.ok().build();
    }


    @DeleteMapping("/dishes/{dishId}")
    public ResponseEntity<String> deleteDish(@PathVariable Integer dishId) {
        dishService.deleteDish(dishId);
        return ResponseEntity.ok("Xóa món ăn thành công!");
    }
}