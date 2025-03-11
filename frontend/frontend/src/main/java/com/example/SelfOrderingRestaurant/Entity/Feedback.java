package com.example.SelfOrderingRestaurant.Entity;

import com.example.SelfOrderingRestaurant.Entity.Enum.FeedbackStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;

@Entity
@Table(name = "customerfeedback")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Feedback {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Feedback_ID")
    private Integer feedbackId;

    @ManyToOne
    @JoinColumn(name = "Customer_ID", referencedColumnName = "Customer_ID")
    private Customer customer;

    @ManyToOne
    @JoinColumn(name = "Order_ID", referencedColumnName = "Order_ID")
    private Order order;

    @Column(name = "Rating", nullable = false)
    private Integer rating;

    @Column(name = "Comment", columnDefinition = "TEXT")
    private String comment;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "FeedbackDate", nullable = false, updatable = false)
    private Date feedbackDate = new Date();

    @Enumerated(EnumType.STRING)
    @Column(name = "Status", columnDefinition = "ENUM('New', 'Reviewed')")
    private FeedbackStatus status = FeedbackStatus.NEW;
}
