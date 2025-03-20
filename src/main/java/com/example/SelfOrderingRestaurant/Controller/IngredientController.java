package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Dto.Request.IngredientRequestDTO.CreateIngredienRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.IngredientRequestDTO.UpdateIngredientRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.IngredientResponseDTO.GetAllIngredientsDTO;
import com.example.SelfOrderingRestaurant.Service.IngredientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ingredient")
public class IngredientController {
    @Autowired
    private IngredientService ingredientService;

    @GetMapping
    public ResponseEntity<?> GetAllIngredientsDTO() {
        return ResponseEntity.ok(ingredientService.getAllIngredients());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getIngredientById(@PathVariable Integer id) {
        return ResponseEntity.ok(ingredientService.getIngedientById(id));
    }

    @PostMapping
    public ResponseEntity<?> createIngredient(@RequestBody CreateIngredienRequestDTO request) {
        return ResponseEntity.ok(ingredientService.createIngedient(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateIngredient(@PathVariable Integer id,
                                              @RequestBody UpdateIngredientRequestDTO request) {
        ingredientService.updateIngredient(id, request);
        return ResponseEntity.ok("Ingredient updated successfully");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteIngredient(@PathVariable Integer id) {
        if(ingredientService.deleteIngredient(id)) {
            return ResponseEntity.ok("Ingredient deleted");
        }
        return ResponseEntity.notFound().build();
    }
}
