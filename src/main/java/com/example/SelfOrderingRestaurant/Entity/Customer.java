package com.example.SelfOrderingRestaurant.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
    @Column(name = "customer_id")
    private Integer customerId;

    @OneToOne
    @JoinColumn(name = "user_id", unique = true)
    @JsonIgnore
    private User user;

    @Column(name = "fullname", nullable = false)
    private String fullname;

    @Temporal(TemporalType.DATE)
    @Column(name = "join_date")
    private Date joinDate;

    @Column(name = "points", columnDefinition = "INT DEFAULT 0 CHECK (Points >= 0)")
    private Integer points = 0;
}
