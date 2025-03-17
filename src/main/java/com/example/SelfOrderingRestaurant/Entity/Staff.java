package com.example.SelfOrderingRestaurant.Entity;

import com.example.SelfOrderingRestaurant.Enum.UserStatus;
import jakarta.persistence.*;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "staff")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Staff {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "staff_id")
    private Integer staffId;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "user_id", unique = true)
    private User user;

    @Column(name = "fullname", nullable = false)
    private String fullname;

    @Column(name = "position")
    private String position;

    @Column(name = "salary")
    private BigDecimal salary;

    @Column(name = "hire_date")
    private LocalDateTime hireDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "Status")
    private UserStatus status;
}
