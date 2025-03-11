package com.example.SelfOrderingRestaurant.Entity;

import com.example.SelfOrderingRestaurant.Entity.Enum.DishStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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
    private Double price;

    @Column(name = "Image")
    private String image;

    @Enumerated(EnumType.STRING)
    @Column(name = "Status", columnDefinition = "ENUM('Available', 'Unavailable') DEFAULT 'Available'")
    private DishStatus status = DishStatus.AVAILABLE;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "CreatedAt", updatable = false)
    private Date createdAt = new Date();

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "UpdatedAt")
    private Date updatedAt = new Date();
}
