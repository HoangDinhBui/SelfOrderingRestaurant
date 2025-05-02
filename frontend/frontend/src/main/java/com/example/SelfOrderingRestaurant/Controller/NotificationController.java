package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Dto.Request.NotificationRequestDTO.NotificationRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.NotificationResponseDTO.NotificationResponseDTO;
import com.example.SelfOrderingRestaurant.Service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;

@AllArgsConstructor
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    // Get notifications for a specific user
    @GetMapping("/{userId}")
    public ResponseEntity<?> getNotifications(@PathVariable Integer userId) {
        if (userId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "User ID cannot be null"));
        }

        try {
            List<NotificationResponseDTO> notifications = notificationService.getNotificationsByUserId(userId);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve notifications: " + e.getMessage()));
        }
    }

    // Get notifications for current shift (for staff dashboard)
    @GetMapping("/shift/current")
    public ResponseEntity<?> getCurrentShiftNotifications() {
        try {
            List<NotificationResponseDTO> notifications = notificationService.getCurrentShiftNotifications();
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve current shift notifications: " + e.getMessage()));
        }
    }

    // Create a new notification (from customer to staff)
    @PostMapping
    public ResponseEntity<?> createNotification(@RequestBody NotificationRequestDTO requestDTO) {
        try {
            System.out.println("Received NotificationRequestDTO: " + requestDTO);

            if (requestDTO == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Notification request cannot be null"));
            }

            notificationService.createNotification(requestDTO);
            return ResponseEntity.ok(Map.of("message", "Notification sent successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to create notification: " + e.getMessage()));
        }
    }

    // Mark a notification as read
    @PutMapping("/{notificationId}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Integer notificationId) {
        if (notificationId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Notification ID cannot be null"));
        }

        try {
            notificationService.markNotificationAsRead(notificationId);
            return ResponseEntity.ok(Map.of("message", "Notification marked as read"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to mark notification as read: " + e.getMessage()));
        }
    }

    // Delete a specific notification
    @DeleteMapping("/{notificationId}")
    public ResponseEntity<?> deleteNotification(@PathVariable Integer notificationId) {
        if (notificationId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Notification ID cannot be null"));
        }

        try {
            notificationService.deleteNotification(notificationId);
            return ResponseEntity.ok(Map.of("message", "Notification deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete notification: " + e.getMessage()));
        }
    }

    // Delete all read notifications for a user
    @DeleteMapping("/read/{userId}")
    public ResponseEntity<?> deleteAllReadNotifications(@PathVariable Integer userId) {
        if (userId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "User ID cannot be null"));
        }

        try {
            notificationService.deleteAllReadNotifications(userId);
            return ResponseEntity.ok(Map.of("message", "All read notifications deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete read notifications: " + e.getMessage()));
        }
    }

    @GetMapping("/table/{tableId}")
    public ResponseEntity<?> getNotificationsByTable(@PathVariable Integer tableId) {
        if (tableId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Table ID cannot be null"));
        }

        try {
            List<NotificationResponseDTO> notifications = notificationService.getNotificationsByTableId(tableId);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve notifications for table: " + e.getMessage()));
        }
    }
}
