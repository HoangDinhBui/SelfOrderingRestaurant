package com.example.SelfOrderingRestaurant.Dto.Response.NotificationResponseDTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class NotificationResponseDTO {
    private int notificationId;
    private String title;
    private String content;
}

