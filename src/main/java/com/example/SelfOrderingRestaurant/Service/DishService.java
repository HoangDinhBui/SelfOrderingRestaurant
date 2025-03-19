package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Request.DishRequestDTO.DishRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.DishResponseDTO.DishResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.DishResponseDTO.GetAllDishesResponseDTO;
import com.example.SelfOrderingRestaurant.Entity.Category;
import com.example.SelfOrderingRestaurant.Entity.Dish;
import com.example.SelfOrderingRestaurant.Entity.Order;
import com.example.SelfOrderingRestaurant.Enum.DishStatus;
import com.example.SelfOrderingRestaurant.Enum.OrderStatus;
import com.example.SelfOrderingRestaurant.Repository.*;
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
    public DishResponseDTO createDish(DishRequestDTO request) {
        Category category = categoryRepository.findById(request.getCategory_id())
                .orElseThrow(() -> new IllegalArgumentException("Category not found!"));
        Dish dish = new Dish();
        dish.setName(request.getName());
        dish.setPrice(request.getPrice());
        dish.setCategory(category);
        dish.setStatus(request.getStatus());

        dish = dishRepository.save(dish);

        return new DishResponseDTO(dish.getDishId(), dish.getName(), dish.getPrice(), category.getName(), dish.getStatus());
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