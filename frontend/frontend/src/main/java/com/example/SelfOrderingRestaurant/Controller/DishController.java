package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Dto.Request.DishRequestDTO.DishRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.DishResponseDTO.DishResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.DishResponseDTO.GetAllDishesResponseDTO;
import com.example.SelfOrderingRestaurant.Entity.Dish;
import com.example.SelfOrderingRestaurant.Service.DishService;
import org.springframework.core.io.UrlResource;
import org.springframework.core.io.Resource;
import jakarta.annotation.security.PermitAll;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
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
        response.put("message", "Dish added successfully!");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/dishes")
    public ResponseEntity<List<GetAllDishesResponseDTO>> getDishes() {
        List<GetAllDishesResponseDTO> dishes = dishService.getAllDishes();
        String baseUrl = "http://localhost:8080/api/images/";
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
                dish.setImageUrl("http://localhost:8080/api/images/" + dish.getImageUrl());
            }
            return ResponseEntity.ok(dish);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    @GetMapping("/images/{imageName}")
    public ResponseEntity<Resource> getImage(@PathVariable String imageName) throws IOException {
        Path imagePath = Paths.get("D:\\UTC2\\FrontendSelfOrderingRestaurant\\selforderingrestaurant\\src\\assets\\img", imageName);

        Resource imageResource = new UrlResource(imagePath.toUri());

        if (!imageResource.exists() || !imageResource.isReadable()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)// IMAGE_PNG nếu là file png
                .body(imageResource);
    }

    @PutMapping(value = "/dishes/{dishId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> updateDish(
            @PathVariable Integer dishId,
            @RequestBody DishRequestDTO dishDTO) {
        dishService.updateDishStatus(dishId, dishDTO.getStatus());
        return ResponseEntity.ok("Update dish successfully!");
    }

    @DeleteMapping("/dishes/{dishId}")
    public ResponseEntity<String> deleteDish(@PathVariable Integer dishId) {
        dishService.deleteDish(dishId);
        return ResponseEntity.ok("Delete dish successfully!");
    }
}