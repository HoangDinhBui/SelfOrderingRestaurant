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
    private Long customerId;

    @OneToOne
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    @Column(name = "Fullname", nullable = false)
    private String fullname;

    @Column(name = "Phone")
    private String phone;

    @Column(name = "Email", unique = true)
    private String email;

    @Temporal(TemporalType.DATE)
    @Column(name = "JoinDate")
    private Date joinDate;

    @Column(name = "Points", columnDefinition = "INT DEFAULT 0 CHECK (Points >= 0)")
    private Integer points = 0;
}
