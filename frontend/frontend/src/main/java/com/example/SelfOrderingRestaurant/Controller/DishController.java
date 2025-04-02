package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Dto.Request.DishRequestDTO.DishRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.DishRequestDTO.DishRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.DishResponseDTO.GetAllDishesResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.OrderResponseDTO.GetAllOrdersResponseDTO;
import com.example.SelfOrderingRestaurant.Entity.Dish;
import com.example.SelfOrderingRestaurant.Service.DishService;
import jakarta.annotation.security.PermitAll;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/dishes")
@RequiredArgsConstructor
@PermitAll
public class DishController {
    @Autowired
    DishService dishService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createDish(@Valid @ModelAttribute DishRequestDTO dishDTO) {
        dishService.createDish(dishDTO);
        return ResponseEntity.ok("Create dish successfully!");
    }

    @GetMapping
    public ResponseEntity<List<GetAllDishesResponseDTO>> getDishes() {
        List<GetAllDishesResponseDTO> dishes = dishService.getAllDishes();
        return ResponseEntity.ok(dishes);
    }

    @PutMapping(value = "/{dishId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> updateDish(
            @PathVariable Integer dishId,
            @ModelAttribute DishRequestDTO dishDTO) {
        dishService.updateDishStatus(dishId, dishDTO.getStatus());
        return ResponseEntity.ok("Update dish successfully!");
    }

    @DeleteMapping("/{dishId}")
    public ResponseEntity<String> deleteDish(@PathVariable Integer dishId) {
        dishService.deleteDish(dishId);
        return ResponseEntity.ok("Delete dish successfully!");
    }
}