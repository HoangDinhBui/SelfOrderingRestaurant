package com.example.SelfOrderingRestaurant.Entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Getter
@Setter
@Entity
@Table(name = "staff_monthly_salary",
        uniqueConstraints = @UniqueConstraint(columnNames = {"staff_id", "month_year"}))
public class StaffMonthlySalary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "salary_id")
    private Integer salaryId;

    @ManyToOne
    @JoinColumn(name = "staff_id", nullable = false)
    private Staff staff;

    @Column(name = "month_year", nullable = false)
    private LocalDate monthYear;

    @ColumnDefault("0.0")
    @Column(name = "total_working_hours")
    private Double totalWorkingHours;

    @Column(name = "hourly_salary", nullable = false, precision = 10, scale = 2)
    private BigDecimal hourlySalary;

    @Column(name = "total_salary", insertable = false, updatable = false)
    private BigDecimal totalSalary;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
