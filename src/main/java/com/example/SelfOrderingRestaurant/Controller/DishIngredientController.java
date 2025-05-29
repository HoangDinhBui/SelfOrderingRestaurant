package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Dto.Response.DishIngredientResponseDTO.DishIngredientResponseDTO;
import com.example.SelfOrderingRestaurant.Entity.DishIngredient;
import com.example.SelfOrderingRestaurant.Repository.DishIngredientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dish_ingredients")
public class DishIngredientController {

    private final DishIngredientRepository dishIngredientRepository;

    @Autowired
    public DishIngredientController(DishIngredientRepository dishIngredientRepository) {
        this.dishIngredientRepository = dishIngredientRepository;
    }

    @GetMapping
    public ResponseEntity<?> getAllDishIngredients() {
        List<DishIngredient> dishIngredients = dishIngredientRepository.findAll();
        List<DishIngredientResponseDTO> response = dishIngredients.stream()
                .map(di -> new DishIngredientResponseDTO(
                        di.getDish().getDishId(),
                        di.getIngredient().getIngredientId(),
                        di.getQuantity()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }
}