package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Request.CategoryRequestDTO.CategoryDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.CategoryResponseDTO.CategoryResponseDTO;
import com.example.SelfOrderingRestaurant.Entity.Category;
import com.example.SelfOrderingRestaurant.Repository.CategoryRepository;
import com.example.SelfOrderingRestaurant.Service.Imp.ICategoryService;
import lombok.AllArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@AllArgsConstructor
@Service
public class CategoryService implements ICategoryService {

    private static final Logger logger = LoggerFactory.getLogger(CategoryService.class);
    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    @Override
    public List<CategoryResponseDTO> getAllCategories() {
        logger.info("Fetching all categories");
        try {
            return categoryRepository.findAll().stream()
                    .map(category -> new CategoryResponseDTO(category.getCategoryId(), category.getName()))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Error fetching categories: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to fetch categories: " + e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    @Override
    public CategoryResponseDTO getCategoryById(Integer id) {
        logger.info("Fetching category with id: {}", id);
        try {
            Category category = categoryRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Category not found with id: " + id));
            return new CategoryResponseDTO(category.getCategoryId(), category.getName());
        } catch (IllegalArgumentException e) {
            logger.error("Category not found with id {}: {}", id, e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Error fetching category with id {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch category: " + e.getMessage());
        }
    }

    @Transactional
    @Override
    public void createCategory(CategoryDTO request) {
        logger.info("Creating category with name: {}", request.getName());
        try {
            if (request.getName() == null || request.getName().isEmpty()) {
                throw new IllegalArgumentException("Category name cannot be empty");
            }
            if (categoryRepository.findByName(request.getName()).isPresent()) {
                throw new IllegalArgumentException("Category already exists");
            }
            Category category = new Category();
            category.setName(request.getName());
            category.setDescription(request.getDescription());
            category.setImage(request.getImage());
            category.setStatus(request.getStatus());
            categoryRepository.save(category);
        } catch (IllegalArgumentException e) {
            logger.error("Validation error creating category: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Error creating category: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create category: " + e.getMessage());
        }
    }

    @Transactional
    @Override
    public void updateCategory(Integer id, CategoryDTO request) {
        logger.info("Updating category with id: {}", id);
        try {
            if (request.getName() == null || request.getName().isEmpty()) {
                throw new IllegalArgumentException("Category name cannot be empty");
            }
            Category category = categoryRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Category not found with id: " + id));
            Optional<Category> existingCategory = categoryRepository.findByName(request.getName());
            if (existingCategory.isPresent() && !existingCategory.get().getCategoryId().equals(id)) {
                throw new IllegalArgumentException("Category name already exists");
            }
            category.setName(request.getName());
            category.setDescription(request.getDescription());
            category.setImage(request.getImage());
            category.setStatus(request.getStatus());
            categoryRepository.save(category);
        } catch (IllegalArgumentException e) {
            logger.error("Validation error updating category {}: {}", id, e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Error updating category with id {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Failed to update category: " + e.getMessage());
        }
    }

    @Transactional
    @Override
    public boolean deleteCategory(Integer id) {
        logger.info("Deleting category with id: {}", id);
        try {
            Optional<Category> category = categoryRepository.findById(id);
            if (category.isPresent()) {
                categoryRepository.deleteById(id);
                return true;
            }
            return false;
        } catch (Exception e) {
            logger.error("Error deleting category with id {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Failed to delete category: " + e.getMessage());
        }
    }
}