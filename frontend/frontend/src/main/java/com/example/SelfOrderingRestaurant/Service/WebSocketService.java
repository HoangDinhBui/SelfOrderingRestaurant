package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Response.NotificationResponseDTO.NotificationResponseDTO;
import com.example.SelfOrderingRestaurant.WebSocket.NotificationWebSocketHandler;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class WebSocketService {

    private final NotificationWebSocketHandler webSocketHandler;

    public WebSocketService(NotificationWebSocketHandler webSocketHandler) {
        this.webSocketHandler = webSocketHandler;
    }

    /**
     * Send notification to staff currently on shift
     */
    public void sendNotificationToActiveStaff(NotificationResponseDTO notification) {
        try {
            webSocketHandler.sendNotificationToStaff(notification);
        } catch (Exception e) {
            log.error("Error sending notification to staff: {}", e.getMessage());
        }
    }

    /**
     * Send notification to a specific user (if needed)
     */
    public void sendNotificationToUser(Integer userId, NotificationResponseDTO notification) {
        try {
            webSocketHandler.sendNotificationToUser(userId, notification);
        } catch (Exception e) {
            log.error("Error sending notification to user {}: {}", userId, e.getMessage());
        }
    }
}
