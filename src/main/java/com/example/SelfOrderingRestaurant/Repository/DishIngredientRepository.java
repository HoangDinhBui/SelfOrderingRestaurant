package com.example.SelfOrderingRestaurant.Repository;
import com.example.SelfOrderingRestaurant.Entity.DishIngredient;
import com.example.SelfOrderingRestaurant.Entity.Key.DishIngredientKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface DishIngredientRepository extends JpaRepository<DishIngredient, DishIngredientKey>{
    @Query("SELECT di FROM DishIngredient di WHERE di.dish.dishId = :dishId")
    List<DishIngredient> findByDishId(Integer dishId);

    @Query("SELECT COALESCE(SUM(di.quantity), 0) FROM DishIngredient di WHERE di.ingredient.ingredientId = :ingredientId")
    BigDecimal getTotalQuantityUsedByIngredientId(Integer ingredientId);

}
