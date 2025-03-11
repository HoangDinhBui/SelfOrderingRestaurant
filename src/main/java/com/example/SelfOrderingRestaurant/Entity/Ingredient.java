package com.example.SelfOrderingRestaurant.Entity;
import com.example.SelfOrderingRestaurant.Entity.Enum.IngredientStatus;
import jakarta.persistence.*;
import lombok.*;

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

    @Column(name = "CostPerUnit", precision = 10, scale = 2)
    private Double costPerUnit;

    @Enumerated(EnumType.STRING)
    @Column(name = "Status", columnDefinition = "ENUM('Available', 'Low', 'OutOfStock') DEFAULT 'Available'")
    private IngredientStatus status = IngredientStatus.AVAILABLE;

    @Column(name = "MinimumQuantity")
    private Integer minimumQuantity;
}
