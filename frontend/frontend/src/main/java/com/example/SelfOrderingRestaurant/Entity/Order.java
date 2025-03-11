package com.example.SelfOrderingRestaurant.Entity;

import com.example.SelfOrderingRestaurant.Entity.Enum.OrderStatus;
import com.example.SelfOrderingRestaurant.Entity.Enum.PaymentStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;

@Entity
@Table(name = "orders")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Order_ID")
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "Staff_ID", referencedColumnName = "Staff_ID")
    private Staff staff;

    @ManyToOne
    @JoinColumn(name = "Table_ID", referencedColumnName = "Table_ID")
    private Tables tables;

    @ManyToOne
    @JoinColumn(name = "Customer_ID", referencedColumnName = "Customer_ID")
    private Customer customer;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "OrderDate", nullable = false, updatable = false)
    private Date orderDate = new Date();

    @Enumerated(EnumType.STRING)
    @Column(name = "Status", columnDefinition = "ENUM('Pending', 'Processing', 'Complete', 'Cancelled') DEFAULT 'Pending'")
    private OrderStatus status = OrderStatus.PENDING;

    @Column(name = "TotalAmount", precision = 10, scale = 2)
    private Double totalAmount;

    @Column(name = "Discount", precision = 10, scale = 2)
    private Double discount;

    @Column(name = "Notes", columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "PaymentStatus")
    private PaymentStatus paymentStatus;
}
