package com.example.SelfOrderingRestaurant.Service.Imp;

import com.example.SelfOrderingRestaurant.Dto.Request.DishRequestDTO.DishRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.DinningTableResponseDTO.DishDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.DishResponseDTO.DishResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.DishResponseDTO.GetAllDishesResponseDTO;
import com.example.SelfOrderingRestaurant.Enum.DishStatus;
import org.springframework.security.core.Authentication;

import java.util.List;

public interface IDishService {
    void createDish(DishRequestDTO request, Authentication authentication);

    List<GetAllDishesResponseDTO> getAllDishes();

    DishResponseDTO getDishById(Integer dishId);

    void updateDishStatus(Integer dishId, DishStatus status);

    void updateDish(Integer dishId, DishRequestDTO request, Authentication authentication);

    void deleteDish(Integer dishId);

     void applyPendingDishUpdates();
}