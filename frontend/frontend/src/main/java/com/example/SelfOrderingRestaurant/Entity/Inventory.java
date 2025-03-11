package com.example.SelfOrderingRestaurant.Entity;
import jakarta.persistence.*;
import lombok.*;

import java.util.Date;

@Entity
@Table(name = "inventory")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Inventory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "InventoryID")
    private Integer inventoryId;

    @ManyToOne
    @JoinColumn(name = "IngredientID", referencedColumnName = "Ingredient_ID")
    private Ingredient ingredient;

    @Column(name = "Quantity", nullable = false)
    private Double quantity;

    @Column(name = "Unit")
    private String unit;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "LastUpdated", nullable = false)
    private Date lastUpdated = new Date();
}
