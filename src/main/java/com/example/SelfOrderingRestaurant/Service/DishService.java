package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Request.DishRequestDTO.DishRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.DishResponseDTO.DishResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.DishResponseDTO.GetAllDishesResponseDTO;
import com.example.SelfOrderingRestaurant.Entity.Category;
import com.example.SelfOrderingRestaurant.Entity.Dish;
import com.example.SelfOrderingRestaurant.Enum.DishStatus;
import com.example.SelfOrderingRestaurant.Repository.CategoryRepository;
import com.example.SelfOrderingRestaurant.Repository.DishRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DishService {
    @Autowired
    private DishRepository dishRepository;
    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private FileStorageService fileStorageService;

    private static final String DISH_IMAGE_DIR = "dishes";

    @Transactional
    public void createDish(DishRequestDTO request) {
        if (request.getCategoryId() == null) {
            throw new IllegalArgumentException("Category ID must not be null");
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Category not found!"));

        Dish dish = new Dish();
        dish.setName(request.getName());
        dish.setPrice(request.getPrice());
        dish.setCategory(category);
        dish.setStatus(request.getStatus());
        dish.setDescription(request.getDescription());

        // Handle file upload
        if (request.getImage() != null && !request.getImage().isEmpty()) {
            String imagePath = fileStorageService.saveFile(request.getImage(), DISH_IMAGE_DIR);
            dish.setImage(imagePath);
        }

        dishRepository.save(dish);
    }

    public List<GetAllDishesResponseDTO> getAllDishes() {
        List<Dish> dishes = dishRepository.findAll();
        return dishes.stream()
                .map(this::mapToGetAllDishesResponseDTO)
                .collect(Collectors.toList());
    }

    private GetAllDishesResponseDTO mapToGetAllDishesResponseDTO(Dish dish) {
        return new GetAllDishesResponseDTO(
                dish.getDishId(),
                dish.getName(),
                dish.getPrice(),
                dish.getStatus()
        );
    }

    @Transactional
    public void updateDishStatus(Integer dishId, DishStatus status) {
        Dish dish = dishRepository.findById(Math.toIntExact(dishId))
                .orElseThrow(() -> new IllegalArgumentException("Dish not found"));

        dish.setStatus(status);
        dishRepository.save(dish);
    }

    @Transactional
    public void deleteDish(Integer dishId) {
        Dish dish = dishRepository.findById(dishId)
                .orElseThrow(() -> new IllegalArgumentException("Dish not found with id: " + dishId));

        // Xóa file ảnh trước khi xóa entity
        if (dish.getImage() != null && !dish.getImage().isEmpty()) {
            fileStorageService.deleteFile(dish.getImage());
        }

        dishRepository.delete(dish);
    }
}
