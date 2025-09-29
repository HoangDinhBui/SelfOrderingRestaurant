package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Dto.Request.CategoryRequestDTO.CategoryDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.CategoryResponseDTO.CategoryResponseDTO;
import com.example.SelfOrderingRestaurant.Service.CategoryService;
import jakarta.annotation.security.PermitAll;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@AllArgsConstructor
@RestController
@RequestMapping("/api")
@PermitAll
public class CategoryController {

    private static final Logger logger = LoggerFactory.getLogger(CategoryController.class);
    private final CategoryService categoryService;

    @GetMapping("/categories")
    public ResponseEntity<?> getAllCategories() {
        logger.info("Fetching all categories");
        try {
            List<CategoryResponseDTO> categories = categoryService.getAllCategories();
            return ResponseEntity.ok(categories);
        } catch (Exception e) {
            logger.error("Error fetching categories: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body("Error fetching categories: " + e.getMessage());
        }
    }

    @GetMapping("/categories/{id}")
    public ResponseEntity<?> getCategoryById(@PathVariable Integer id) {
        logger.info("Fetching category with id: {}", id);
        try {
            CategoryResponseDTO category = categoryService.getCategoryById(id);
            return ResponseEntity.ok(category);
        } catch (IllegalArgumentException e) {
            logger.error("Error fetching category with id {}: {}", id, e.getMessage());
            return ResponseEntity.status(404).body("Category not found with id: " + id);
        } catch (Exception e) {
            logger.error("Error fetching category with id {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(500).body("Error fetching category: " + e.getMessage());
        }
    }

    @PostMapping("/admin/categories")
    public ResponseEntity<?> createCategory(@Valid @RequestBody CategoryDTO request) {
        logger.info("Creating category with name: {}", request.getName());
        try {
            categoryService.createCategory(request);
            return ResponseEntity.ok("Create category successfully");
        } catch (IllegalArgumentException e) {
            logger.error("Validation error creating category: {}", e.getMessage());
            return ResponseEntity.status(400).body("Validation error: " + e.getMessage());
        } catch (Exception e) {
            logger.error("Error creating category: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body("Error creating category: " + e.getMessage());
        }
    }

    @PutMapping("/admin/categories/{id}")
    public ResponseEntity<?> updateCategory(@PathVariable Integer id, @Valid @RequestBody CategoryDTO request) {
        logger.info("Updating category with id: {}", id);
        try {
            categoryService.updateCategory(id, request);
            return ResponseEntity.ok("Update category successfully");
        } catch (IllegalArgumentException e) {
            logger.error("Validation error updating category {}: {}", id, e.getMessage());
            return ResponseEntity.status(400).body("Validation error: " + e.getMessage());
        } catch (Exception e) {
            logger.error("Error updating category with id {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(500).body("Error updating category: " + e.getMessage());
        }
    }

    @DeleteMapping("/admin/categories/{id}")
    public ResponseEntity<?> deleteCategory(@PathVariable Integer id) {
        logger.info("Deleting category with id: {}", id);
        try {
            if (categoryService.deleteCategory(id)) {
                return ResponseEntity.ok("Category deleted successfully");
            }
            return ResponseEntity.status(404).body("Category not found with id: " + id);
        } catch (Exception e) {
            logger.error("Error deleting category with id {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(500).body("Error deleting category: " + e.getMessage());
        }
    }
}