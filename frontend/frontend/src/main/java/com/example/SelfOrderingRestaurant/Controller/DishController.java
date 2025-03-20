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
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dishes")
@RequiredArgsConstructor
@PermitAll
public class DishController {
    @Autowired
    DishService dishService;

    @PostMapping
    public ResponseEntity<?> createDish(@Valid @RequestBody DishRequestDTO dishDTO) {
        dishService.createDish(dishDTO);
        return ResponseEntity.ok("Create dish successfully!");
    }

    @GetMapping
    public ResponseEntity<?> getDishes() {
        List<GetAllDishesResponseDTO> dishes = dishService.getAllDishes();
        return ResponseEntity.ok(dishes);
    }
}