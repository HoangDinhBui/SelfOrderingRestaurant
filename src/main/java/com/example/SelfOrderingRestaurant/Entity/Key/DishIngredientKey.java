package com.example.SelfOrderingRestaurant.Entity.Key;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Objects;

@Embeddable
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class DishIngredientKey {
    @Column(name = "Dish_ID")
    private Integer dishId;

    @Column(name = "Ingredient_ID")
    private Integer ingredientId;

//    @Override
//    public boolean equals(Object o) {
//        if (this == o) return true;
//        if (o == null || getClass() != o.getClass()) return false;
//        DishIngredientKey that = (DishIngredientKey) o;
//        return Objects.equals(dishId, that.getDishId()) &&
//                Objects.equals(ingredientId, that.getIngredientId());
//    }
//
//    @Override
//    public int hashCode() {
//        return Objects.hash(dishId, ingredientId);
//    }
}
