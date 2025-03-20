package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Response.NotificationResponseDTO.NotificationResponseDTO;
import com.example.SelfOrderingRestaurant.Entity.Notification;
import com.example.SelfOrderingRestaurant.Repository.NotificationRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {
    @Autowired
    private NotificationRepository notificationRepository;

     @Transactional
    public List<NotificationResponseDTO> getNotificationsByUserId(Integer userId){
        List<Notification> notifications = notificationRepository.findByUserUserId(userId);
        return notifications.stream()
                .map(n -> new NotificationResponseDTO(
                        n.getNotificationId(),
                        n.getTitle(),
                        n.getContent()
                ))
                .collect(Collectors.toList());
    }
}
