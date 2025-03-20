package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Request.IngredientRequestDTO.CreateIngredienRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.IngredientRequestDTO.UpdateIngredientRequestDTO;
import com.example.SelfOrderingRestaurant.Entity.Category;
import com.example.SelfOrderingRestaurant.Entity.Ingredient;
import com.example.SelfOrderingRestaurant.Entity.Supplier;
import com.example.SelfOrderingRestaurant.Repository.IngredientRepository;
import com.example.SelfOrderingRestaurant.Repository.SupplierRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class IngredientService {
    @Autowired
    private IngredientRepository ingredientRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Transactional
    public List<Ingredient> getAllIngredients() {
        return ingredientRepository.findAll();
    }

    @Transactional
    public Ingredient getIngedientById(Integer id) {
        return ingredientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ingredient not found"));
    }

    @Transactional
    public CreateIngredienRequestDTO createIngedient(CreateIngredienRequestDTO request) {
        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new RuntimeException("Supplier not found"));

        Ingredient ingredient = new Ingredient();
        ingredient.setName(request.getName());
        ingredient.setCostPerUnit(request.getCostPerUnit());
        ingredient.setStatus(request.getStatus());
        ingredient.setMinimumQuantity(request.getMinimumQuantity());
        ingredient.setSupplier(supplier);

        Ingredient ingredientSaved = ingredientRepository.save(ingredient);

        CreateIngredienRequestDTO response = new CreateIngredienRequestDTO();
        response.setName(ingredientSaved.getName());
        response.setUnit(ingredientSaved.getUnit());
        response.setCostPerUnit(ingredientSaved.getCostPerUnit());
        response.setStatus(ingredientSaved.getStatus());
        response.setMinimumQuantity(ingredientSaved.getMinimumQuantity());
        response.setSupplierId(ingredientSaved.getSupplier().getSupplierId());

        return response;
    }

    @Transactional
    public void updateIngredient(Integer id, UpdateIngredientRequestDTO request) {
        Ingredient ingredient = ingredientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ingredient not found with ID: " + id));

        ingredient.setName(request.getName());
        ingredient.setStatus(request.getStatus());

        ingredientRepository.save(ingredient);
    }

    @Transactional
    public boolean deleteIngredient(Integer id) {
        Optional<Ingredient> ingredient = ingredientRepository.findById(id);
        if(ingredient.isPresent()) {
            ingredientRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
