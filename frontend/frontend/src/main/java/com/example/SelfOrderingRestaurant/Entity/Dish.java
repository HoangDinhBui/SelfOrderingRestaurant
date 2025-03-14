package com.example.SelfOrderingRestaurant.Entity;

import com.example.SelfOrderingRestaurant.Entity.Enum.DishStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Date;

@Entity
@Table(name = "dishes")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Dish {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Dish_ID")
    private Integer dishId;

    @ManyToOne
    @JoinColumn(name = "Category_ID", referencedColumnName = "Category_ID")
    private Category category;

    @Column(name = "Name", nullable = false)
    private String name;

    @Column(name = "Description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "Price", precision = 10, scale = 2, nullable = false)
    private BigDecimal price;

    @Column(name = "Image")
    private String image;

    @Enumerated(EnumType.STRING)
    @Column(name = "Status")
    private DishStatus status = DishStatus.AVAILABLE;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "CreatedAt", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "UpdatedAt")
    private LocalDateTime updatedAt = LocalDateTime.now();
}
