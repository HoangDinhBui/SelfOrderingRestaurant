package com.example.SelfOrderingRestaurant.Entity.Key;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Embeddable
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class DishIngredientKey {
    private Integer dishId;
    private Integer ingredientId;
}
