package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Dto.Request.NotificationRequestDTO.NotificationRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.NotificationResponseDTO.NotificationResponseDTO;
import com.example.SelfOrderingRestaurant.Service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    @Autowired
    private NotificationService notificationService;

    // Get notifications for a specific user
    @GetMapping("/{userId}")
    public ResponseEntity<?> getNotifications(@PathVariable Integer userId) {
        List<NotificationResponseDTO> notifications = notificationService.getNotificationsByUserId(userId);
        return ResponseEntity.ok(notifications);
    }

    // Get notifications for current shift (for staff dashboard)
    @GetMapping("/shift/current")
    public ResponseEntity<?> getCurrentShiftNotifications() {
        List<NotificationResponseDTO> notifications = notificationService.getCurrentShiftNotifications();
        return ResponseEntity.ok(notifications);
    }

    // Create a new notification (from customer to staff)
    @PostMapping
    public ResponseEntity<?> createNotification(@RequestBody NotificationRequestDTO requestDTO) {
        try {
            notificationService.createNotification(requestDTO);
            return ResponseEntity.ok(Map.of("message", "Notification sent successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Mark a notification as read
    @PutMapping("/{notificationId}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Integer notificationId) {
        try {
            notificationService.markNotificationAsRead(notificationId);
            return ResponseEntity.ok(Map.of("message", "Notification marked as read"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
