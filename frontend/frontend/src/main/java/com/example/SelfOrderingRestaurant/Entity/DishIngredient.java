package com.example.SelfOrderingRestaurant.Entity;
import com.example.SelfOrderingRestaurant.Entity.Key.DishIngredientKey;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;

@Entity
@Table(name = "dishingredients")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class DishIngredient {
    @EmbeddedId
    private DishIngredientKey id;

    @ManyToOne
    @MapsId("dishId")
    @JoinColumn(name = "Dish_ID")
    private Dish dish;

    @ManyToOne
    @MapsId("ingredientId")
    @JoinColumn(name = "Ingredient_ID")
    private Ingredient ingredient;

    @Column(name = "Quantity", nullable = false)
    private BigDecimal quantity;
}
