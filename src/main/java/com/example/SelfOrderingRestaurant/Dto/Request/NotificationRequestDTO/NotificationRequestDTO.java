package com.example.SelfOrderingRestaurant.Dto.Request.NotificationRequestDTO;

import com.example.SelfOrderingRestaurant.Enum.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class NotificationRequestDTO {
    private Integer tableNumber;
    private Integer customerId;
    private Integer orderId;
    private NotificationType type;
    private String additionalMessage;
}
