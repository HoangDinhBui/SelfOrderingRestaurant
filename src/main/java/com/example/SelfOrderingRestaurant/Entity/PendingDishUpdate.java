package com.example.SelfOrderingRestaurant.Entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "pending_dish_updates")
@Getter
@Setter
@Data
public class PendingDishUpdate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer pendingId;

    @Column(name = "dish_id")
    private Integer dishId;

    @Column(name = "name")
    private String name;

    @Column(name = "description")
    private String description;

    @Column(name = "price")
    private BigDecimal price;

    @Column(name = "category_id")
    private Integer categoryId;

    @Column(name = "image")
    private String image;

    @Column(name = "status")
    private String status;

    @Column(name = "effective_date_time")
    private LocalDateTime effectiveDateTime;
}
