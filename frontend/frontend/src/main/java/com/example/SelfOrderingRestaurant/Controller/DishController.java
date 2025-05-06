package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Dto.Request.DishRequestDTO.DishRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.DishResponseDTO.DishResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.DishResponseDTO.GetAllDishesResponseDTO;
import com.example.SelfOrderingRestaurant.Service.DishService;
import jakarta.annotation.security.PermitAll;
import jakarta.validation.Valid;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@PermitAll
public class DishController {

    private static final Logger logger = LoggerFactory.getLogger(DishController.class);
    private final DishService dishService;

    @PostMapping(path = "/admin/dishes", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createDish(@Valid @ModelAttribute DishRequestDTO dishDTO, Authentication authentication) {
        logger.info("Creating dish with name: {}", dishDTO.getName());
        try {
            dishService.createDish(dishDTO, authentication);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Thêm món ăn thành công!");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error creating dish: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body("Error creating dish: " + e.getMessage());
        }
    }

    @GetMapping("/dishes")
    public ResponseEntity<List<GetAllDishesResponseDTO>> getDishes() {
        logger.info("Fetching all dishes");
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
        logger.info("Fetching dish with id: {}", dishId);
        try {
            DishResponseDTO dish = dishService.getDishById(dishId);
            if (dish.getImageUrl() != null) {
                dish.setImageUrl("http://localhost:8080/uploads/" + dish.getImageUrl());
            }
            return ResponseEntity.ok(dish);
        } catch (IllegalArgumentException e) {
            logger.error("Error fetching dish: {}", e.getMessage());
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    @PostMapping(value = "/admin/dishes/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateDish(
            @PathVariable Integer id,
            @ModelAttribute DishRequestDTO request,
            Authentication authentication
    ) {
        logger.info("Updating dish with id: {}", id);
        try {
            dishService.updateDish(id, request, authentication);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Cập nhật món ăn thành công!");
            return ResponseEntity.ok(response);
        } catch (ValidationException e) {
            logger.error("Validation error updating dish {}: {}", id, e.getMessage());
            return ResponseEntity.status(400).body("Validation error: " + e.getMessage());
        } catch (Exception e) {
            logger.error("Error updating dish with id {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(500).body("Error updating dish: " + e.getMessage());
        }
    }

    @DeleteMapping("/dishes/{dishId}")
    public ResponseEntity<String> deleteDish(@PathVariable Integer dishId) {
        logger.info("Deleting dish with id: {}", dishId);
        try {
            dishService.deleteDish(dishId);
            return ResponseEntity.ok("Xóa món ăn thành công!");
        } catch (Exception e) {
            logger.error("Error deleting dish: {}", e.getMessage());
            return ResponseEntity.status(500).body("Error deleting dish: " + e.getMessage());
        }
    }
}