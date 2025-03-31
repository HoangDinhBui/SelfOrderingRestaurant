package com.example.SelfOrderingRestaurant.Dto.Response.NotificationResponseDTO;

import com.example.SelfOrderingRestaurant.Enum.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class NotificationResponseDTO {
    private Integer notificationId;
    private String title;
    private String content;
    private Boolean isRead;
    private NotificationType type;
    private LocalDateTime createAt;
    private Integer tableNumber; // Added to easily identify which table needs attention
    private Integer orderId;     // Added to reference the order if applicable
}

