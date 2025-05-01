package com.example.SelfOrderingRestaurant.Service.Imp;

import com.example.SelfOrderingRestaurant.Dto.Request.NotificationRequestDTO.NotificationRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.NotificationResponseDTO.NotificationResponseDTO;
import com.example.SelfOrderingRestaurant.Entity.Notification;
import com.example.SelfOrderingRestaurant.Entity.Staff;

import java.util.List;

public interface INotificationService {
    List<NotificationResponseDTO> getNotificationsByUserId(Integer userId);
    List<NotificationResponseDTO> getNotificationsByTableId(Integer tableId);
    List<NotificationResponseDTO> getCurrentShiftNotifications();
    void markNotificationAsRead(Integer notificationId);
    void createNotification(NotificationRequestDTO requestDTO);
    void cleanupOldNotifications();
    void deleteNotification(Integer notificationId);
    void deleteAllReadNotifications(Integer userId);
}