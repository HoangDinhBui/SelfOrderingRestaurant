package com.example.SelfOrderingRestaurant.Entity;

import com.example.SelfOrderingRestaurant.Entity.Enum.UserStatus;
import jakarta.persistence.*;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;

@Entity
@Table(name = "staff")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Staff {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Staff_ID")
    private Integer id;

    @OneToOne
    @JoinColumn(name = "User_ID", referencedColumnName = "User_ID", unique = true)
    private User user;

    @Column(name = "Fullname", nullable = false)
    private String fullname;

    @Column(name = "Position")
    private String position;

    @Column(name = "Salary")
    private Double salary;

    @Column(name = "HireDate")
    private Date hireDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "Status")
    private UserStatus status;
}
