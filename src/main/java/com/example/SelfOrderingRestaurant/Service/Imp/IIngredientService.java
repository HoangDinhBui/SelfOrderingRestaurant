package com.example.SelfOrderingRestaurant.Service.Imp;

import com.example.SelfOrderingRestaurant.Dto.Request.IngredientRequestDTO.CreateIngredienRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.IngredientRequestDTO.UpdateIngredientRequestDTO;
import com.example.SelfOrderingRestaurant.Entity.Ingredient;

import java.util.List;

public interface IIngredientService {
    List<Ingredient> getAllIngredients();
    Ingredient getIngedientById(Integer id);
    void createIngedient(CreateIngredienRequestDTO request);
    void updateIngredient(Integer id, UpdateIngredientRequestDTO request);
    boolean deleteIngredient(Integer id);
}
