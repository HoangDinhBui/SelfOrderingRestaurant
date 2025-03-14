package com.example.SelfOrderingRestaurant.Entity;
import com.example.SelfOrderingRestaurant.Entity.Enum.IngredientStatus;
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
    @Column(name = "Ingredient_ID")
    private Integer ingredientId;

    @ManyToOne
    @JoinColumn(name = "Supplier_ID", referencedColumnName = "Supplier_ID")
    private Supplier supplier;

    @Column(name = "Name", nullable = false)
    private String name;

    @Column(name = "Description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "Unit")
    private String unit;

    @Column(name = "CostPerUnit")
    private BigDecimal costPerUnit;

    @Enumerated(EnumType.STRING)
    @Column(name = "Status")
    private IngredientStatus status = IngredientStatus.AVAILABLE;

    @Column(name = "MinimumQuantity")
    private Integer minimumQuantity = 1;
}
