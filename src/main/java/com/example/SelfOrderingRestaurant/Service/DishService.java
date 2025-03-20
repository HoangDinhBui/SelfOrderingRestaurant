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

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DishService {
    @Autowired
    private DishRepository dishRepository;
    @Autowired
    private CategoryRepository categoryRepository;

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
        dish.setImage(request.getImage());

        dishRepository.save(dish);
    }

    @Transactional
    public List<GetAllDishesResponseDTO> getAllDishes() {
        return dishRepository.findAll().stream()
                .map(dishes -> new GetAllDishesResponseDTO(
                        dishes.getDishId(),
                        dishes.getName(),
                        dishes.getPrice(),
                        dishes.getStatus()
                )).collect(Collectors.toList());
    }

    @Transactional
    public void updateDishStatus(Long dishId, String status) {
        Dish dish = dishRepository.findById(Math.toIntExact(dishId))
                .orElseThrow(() -> new IllegalArgumentException("Dish not found"));

        try {
            DishStatus newStatus = DishStatus.valueOf(status.toUpperCase());
            dish.setStatus(newStatus);
            dishRepository.save(dish);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid order status: " + status);
        }
    }
}
