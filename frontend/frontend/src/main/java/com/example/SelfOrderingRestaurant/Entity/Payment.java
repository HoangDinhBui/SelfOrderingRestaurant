package com.example.SelfOrderingRestaurant.Entity;

import com.example.SelfOrderingRestaurant.Enum.PaymentMethod;
import com.example.SelfOrderingRestaurant.Enum.PaymentStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

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

    @OneToOne
    @JoinColumn(name = "Order_ID", referencedColumnName = "Order_ID")
    private Order order;

    @ManyToOne
    @JoinColumn(name = "Customer_ID", referencedColumnName = "Customer_ID")
    private Customer customer;

    @Column(name = "Amount", precision = 10, scale = 2, nullable = false)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "PaymentMethod")
    private PaymentMethod paymentMethod;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "PaymentDate", nullable = false, updatable = false)
    private LocalDateTime paymentDate = LocalDateTime.now();

    @Column(name = "TransactionID", unique = true)
    private String transactionId;

    @Enumerated(EnumType.STRING)
    @Column(name = "Status")
    private PaymentStatus status;
}
