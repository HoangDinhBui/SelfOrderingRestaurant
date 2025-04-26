package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Request.IngredientRequestDTO.CreateIngredienRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.IngredientRequestDTO.UpdateIngredientRequestDTO;
import com.example.SelfOrderingRestaurant.Entity.Category;
import com.example.SelfOrderingRestaurant.Entity.Ingredient;
import com.example.SelfOrderingRestaurant.Entity.Supplier;
import com.example.SelfOrderingRestaurant.Repository.IngredientRepository;
import com.example.SelfOrderingRestaurant.Repository.SupplierRepository;
import com.example.SelfOrderingRestaurant.Service.Imp.IIngredientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import lombok.AllArgsConstructor;

@AllArgsConstructor
@Service
public class IngredientService implements IIngredientService {

    private final IngredientRepository ingredientRepository;


    private final SupplierRepository supplierRepository;

    @Transactional
    @Override
    public List<Ingredient> getAllIngredients() {
        return ingredientRepository.findAll();
    }

    @Transactional
    @Override
    public Ingredient getIngedientById(Integer id) {
        return ingredientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ingredient not found"));
    }

    @Transactional
    @Override
    public void createIngedient(CreateIngredienRequestDTO request) {
        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new RuntimeException("Supplier not found"));

        Ingredient ingredient = new Ingredient();
        ingredient.setName(request.getName());
        ingredient.setCostPerUnit(request.getCostPerUnit());
        ingredient.setUnit(request.getUnit());
        ingredient.setStatus(request.getStatus());
        ingredient.setMinimumQuantity(request.getMinimumQuantity());
        ingredient.setSupplier(supplier);

        ingredientRepository.save(ingredient);
    }

    @Transactional
    @Override
    public void updateIngredient(Integer id, UpdateIngredientRequestDTO request) {
        Ingredient ingredient = ingredientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ingredient not found with ID: " + id));

        ingredient.setName(request.getName());
        ingredient.setStatus(request.getStatus());

        ingredientRepository.save(ingredient);
    }

    @Transactional
    @Override
    public boolean deleteIngredient(Integer id) {
        Optional<Ingredient> ingredient = ingredientRepository.findById(id);
        if(ingredient.isPresent()) {
            ingredientRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
