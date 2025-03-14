package com.example.SelfOrderingRestaurant.Entity;

import jakarta.persistence.*;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;

@Entity
@Table(name = "customers")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Customer_ID")
    private Integer customerId;

    @OneToOne
    @JoinColumn(name = "User_ID", unique = true)
    private User user;

    @Column(name = "Fullname", nullable = false)
    private String fullname;

    @Temporal(TemporalType.DATE)
    @Column(name = "JoinDate")
    private Date joinDate;

    @Column(name = "Points", columnDefinition = "INT DEFAULT 0 CHECK (Points >= 0)")
    private Integer points = 0;
}
