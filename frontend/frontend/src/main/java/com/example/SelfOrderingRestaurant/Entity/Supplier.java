package com.example.SelfOrderingRestaurant.Entity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "suppliers")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Supplier {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Supplier_ID")
    private Integer supplierId;

    @Column(name = "Name", nullable = false)
    private String name;

    @Column(name = "ContactPerson")
    private String contactPerson;

    @Column(name = "Phone", unique = true)
    private String phone;

    @Column(name = "Email", unique = true)
    private String email;

    @Column(name = "Address", columnDefinition = "TEXT")
    private String address;
}
