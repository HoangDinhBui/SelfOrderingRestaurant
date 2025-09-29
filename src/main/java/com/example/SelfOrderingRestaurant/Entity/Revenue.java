package com.example.SelfOrderingRestaurant.Entity;

import com.example.SelfOrderingRestaurant.Entity.Staff;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "revenue")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Revenue {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "revenue_id")
    private Long revenueId;

    @Column(name = "date", nullable = false, unique = true)
    private LocalDate date;

    @Column(name = "total_revenue", precision = 12, scale = 2)
    private BigDecimal totalRevenue;

    @Column(name = "total_orders")
    private Integer totalOrders;

    @Column(name = "total_customers")
    private Integer totalCustomers = 0;

    @Column(name = "food_revenue", precision = 10, scale = 2)
    private BigDecimal foodRevenue = BigDecimal.ZERO;

    @Column(name = "drink_revenue", precision = 10, scale = 2)
    private BigDecimal drinkRevenue = BigDecimal.ZERO;

    @Column(name = "other_revenue", precision = 10, scale = 2)
    private BigDecimal otherRevenue = BigDecimal.ZERO;

    @Column(name = "total_discount", precision = 10, scale = 2)
    private BigDecimal totalDiscount = BigDecimal.ZERO;

    @Column(name = "net_revenue", precision = 12, scale = 2, insertable = false, updatable = false)
    private BigDecimal netRevenue;

    @Column(name = "average_order_value", precision = 12, scale = 2, insertable = false, updatable = false)
    private BigDecimal averageOrderValue;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id")
    private Staff staff;

    @Column(name = "notes")
    private String notes;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Pre-persist và Pre-update hooks để tự động cập nhật timestamps
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}