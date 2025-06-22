package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Response.DinningTableResponseDTO.TableTransferNotificationDTO;
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

    public void sendNotificationToActiveStaff(NotificationResponseDTO notification) {
        try {
            webSocketHandler.sendNotificationToStaff(notification);
        } catch (Exception e) {
            log.error("Error sending notification to staff: {}", e.getMessage());
        }
    }

    public void sendNotificationToUser(Integer userId, NotificationResponseDTO notification) {
        try {
            webSocketHandler.sendNotificationToUser(userId, notification);
        } catch (Exception e) {
            log.error("Error sending notification to user {}: {}", userId, e.getMessage());
        }
    }

    public void sendTableTransferNotification(Integer sourceTableId, Integer destinationTableId) {
        try {
            TableTransferNotificationDTO notification = new TableTransferNotificationDTO(sourceTableId, destinationTableId);
            webSocketHandler.sendTableTransferNotification(notification);
        } catch (Exception e) {
            log.error("Error sending TABLE_TRANSFERRED notification for tables {} and {}: {}",
                    sourceTableId, destinationTableId, e.getMessage());
        }
    }
}
