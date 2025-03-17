package com.example.SelfOrderingRestaurant.Entity;
import com.example.SelfOrderingRestaurant.Enum.IngredientStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "ingredients")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Ingredient {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ingredient_id")
    private Integer ingredientId;

    @ManyToOne
    @JoinColumn(name = "supplier_id", referencedColumnName = "supplier_id")
    private Supplier supplier;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "unit")
    private String unit;

    @Column(name = "cost_per_unit")
    private BigDecimal costPerUnit;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private IngredientStatus status = IngredientStatus.AVAILABLE;

    @Column(name = "minimum_quantity")
    private Integer minimumQuantity = 1;
}
