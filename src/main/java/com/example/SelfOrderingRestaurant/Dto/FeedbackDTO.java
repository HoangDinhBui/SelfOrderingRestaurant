package com.example.SelfOrderingRestaurant.Dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackDTO {
    private Long feedbackId;
    private Long customerId;
    private Long orderId;
    private Integer rating;
    private String comment;
    private LocalDateTime feedbackDate;
}