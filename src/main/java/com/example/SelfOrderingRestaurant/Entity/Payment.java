package com.example.SelfOrderingRestaurant.Entity;

import com.example.SelfOrderingRestaurant.Entity.Enum.PaymentMethod;
import com.example.SelfOrderingRestaurant.Entity.Enum.PaymentStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;

@Entity
@Table(name = "payments")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Payment_ID")
    private Integer paymentId;

    @ManyToOne
    @JoinColumn(name = "Order_ID", referencedColumnName = "Order_ID")
    private Order order;

    @ManyToOne
    @JoinColumn(name = "Customer_ID", referencedColumnName = "Customer_ID")
    private Customer customer;

    @Column(name = "Amount", precision = 10, scale = 2, nullable = false)
    private Double amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "PaymentMethod")
    private PaymentMethod paymentMethod;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "PaymentDate", nullable = false, updatable = false)
    private Date paymentDate = new Date();

    @Column(name = "TransactionID", unique = true)
    private String transactionId;

    @Enumerated(EnumType.STRING)
    @Column(name = "Status")
    private PaymentStatus status;

    @Column(name = "Notes", columnDefinition = "TEXT")
    private String notes;
}
