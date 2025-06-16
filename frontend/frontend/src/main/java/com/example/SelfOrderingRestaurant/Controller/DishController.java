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
import org.springframework.core.io.Resource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@PermitAll
public class DishController {

    private static final Logger logger = LoggerFactory.getLogger(DishController.class);
    private static final String DISH_IMAGE_DIR = "uploads/dishes";
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
        String baseUrl = "http://localhost:8080/uploads/dishes/";
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
            LocalTime currentTime = LocalTime.now();
            LocalTime startBusinessHour = LocalTime.of(8, 0);
            LocalTime endBusinessHour = LocalTime.of(17, 0);
            String message = currentTime.isAfter(startBusinessHour) && currentTime.isBefore(endBusinessHour)
                    ? "Cập nhật món ăn đã được lưu và sẽ có hiệu lực từ 0h ngày mai!"
                    : "Cập nhật món ăn thành công!";
            response.put("message", message);
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

    @GetMapping(value = "/images/{imageName:.+}", produces = {
            MediaType.IMAGE_JPEG_VALUE,
            MediaType.IMAGE_PNG_VALUE,
            MediaType.IMAGE_GIF_VALUE
    })
    public ResponseEntity<Resource> getImage(@PathVariable String imageName) {
        logger.info("Fetching image: {}", imageName);
        try {
            // Construct the absolute path to the image
            Path imagePath = Paths.get(DISH_IMAGE_DIR, imageName).normalize();
            FileSystemResource resource = new FileSystemResource(imagePath);

            // Check if the file exists and is readable
            if (!resource.exists() || !resource.isReadable()) {
                logger.warn("Image not found: {}", imageName);
                return ResponseEntity.notFound().build();
            }

            // Determine the content type based on file extension
            String contentType = Files.probeContentType(imagePath);
            if (contentType == null) {
                contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + imageName + "\"")
                    .body(resource);
        } catch (IOException e) {
            logger.error("Error reading image {}: {}", imageName, e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }
}