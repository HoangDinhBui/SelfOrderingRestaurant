package com.example.SelfOrderingRestaurant.WebSocket;

import com.example.SelfOrderingRestaurant.Dto.Response.NotificationResponseDTO.NotificationResponseDTO;
import com.example.SelfOrderingRestaurant.Entity.Staff;
import com.example.SelfOrderingRestaurant.Repository.StaffShiftRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class NotificationWebSocketHandler extends TextWebSocketHandler {

    // Store active WebSocket sessions mapped to staff user IDs who are currently on shift
    private static final Map<Integer, Set<WebSocketSession>> staffSessions = new ConcurrentHashMap<>();

    // Store admin sessions
    private static final Set<WebSocketSession> adminSessions = ConcurrentHashMap.newKeySet();

    @Autowired
    private StaffShiftRepository staffShiftRepository;

    @Autowired
    private ObjectMapper objectMapper; // Tiêm ObjectMapper từ JacksonConfig

    /**
     * When a WebSocket connection is established
     */
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Map<String, String> attributes = extractQueryParams(session.getUri());
        String userType = attributes.get("userType");
        String userIdStr = attributes.get("userId");

        log.info("WebSocket connection attempt: userId={}, userType={}", userIdStr, userType);
        if (userIdStr != null) {
            try {
                Integer userId = Integer.parseInt(userIdStr);

                // Register session based on user type
                if ("STAFF".equalsIgnoreCase(userType)) {
                    // Temporarily bypass shift check for testing
                    staffSessions.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet()).add(session);
                    log.info("Staff user {} connected to notification WebSocket (bypassed shift check)", userId);

                    // Original shift check (commented out for testing)
                    /*
                    LocalDate today = LocalDate.now();
                    LocalTime currentTime = LocalTime.now();
                    List<Staff> onShiftStaff = staffShiftRepository.findStaffOnCurrentShift(today, currentTime);
                    boolean isOnShift = onShiftStaff.stream()
                            .anyMatch(staff -> staff.getUser().getUserId().equals(userId));
                    log.info("Staff user {} on shift: {}. Active staff: {}", userId, isOnShift, onShiftStaff);
                    if (isOnShift) {
                        staffSessions.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet()).add(session);
                        log.info("Staff user {} connected to notification WebSocket (on current shift)", userId);
                    } else {
                        log.warn("Staff user {} connected but not on current shift - notifications restricted", userId);
                    }
                    */
                } else if ("ADMIN".equalsIgnoreCase(userType)) {
                    adminSessions.add(session);
                    log.info("Admin {} connected to notification WebSocket", userId);
                }
                // Customer connections are not stored as we don't send notifications to them
            } catch (NumberFormatException e) {
                log.error("Invalid userId format in WebSocket connection: {}", userIdStr);
            }
        } else {
            log.warn("WebSocket connection without userId parameter");
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        // Remove session from all mappings
        adminSessions.remove(session);

        for (Map.Entry<Integer, Set<WebSocketSession>> entry : staffSessions.entrySet()) {
            entry.getValue().remove(session);
            // Clean up empty sets
            if (entry.getValue().isEmpty()) {
                staffSessions.remove(entry.getKey());
            }
        }

        log.info("WebSocket connection closed: {}", status);
    }

    /**
     * Send notification to a specific user
     */
    public void sendNotificationToUser(Integer userId, NotificationResponseDTO notification) {
        try {
            String jsonNotification = objectMapper.writeValueAsString(notification);
            Set<WebSocketSession> sessions = staffSessions.get(userId);

            if (sessions != null && !sessions.isEmpty()) {
                for (WebSocketSession session : sessions) {
                    if (session.isOpen()) {
                        session.sendMessage(new TextMessage(jsonNotification));
                        log.info("Sent notification to user {} session {}: {}", userId, session.getId(), jsonNotification);
                    }
                }
                log.info("Notification sent to staff user {}: {}", userId, notification.getTitle());
            } else {
                log.warn("No active sessions found for user {}", userId);
            }
        } catch (IOException e) {
            log.error("Error sending notification to user {}: {}", userId, e.getMessage());
        }
    }

    /**
     * Send notification to all active staff on current shift
     */
    public void sendNotificationToStaff(NotificationResponseDTO notification) {
        try {
            String jsonNotification = objectMapper.writeValueAsString(notification);
            log.info("Broadcasting notification to {} staff sessions: {}", staffSessions.size(), jsonNotification);

            // Send to staff on shift
            for (Map.Entry<Integer, Set<WebSocketSession>> entry : staffSessions.entrySet()) {
                for (WebSocketSession session : entry.getValue()) {
                    if (session.isOpen()) {
                        session.sendMessage(new TextMessage(jsonNotification));
                        log.info("Sent notification to staff user {} session {}: {}", entry.getKey(), session.getId(), jsonNotification);
                    }
                }
            }

            // Also send to admins
            for (WebSocketSession session : adminSessions) {
                if (session.isOpen()) {
                    session.sendMessage(new TextMessage(jsonNotification));
                    log.info("Sent notification to admin session {}: {}", session.getId(), jsonNotification);
                }
            }

            log.info("Notification broadcast to all active staff: {}", notification.getTitle());
        } catch (IOException e) {
            log.error("Error broadcasting notification to staff: {}", e.getMessage());
        }
    }

    /**
     * Extract query parameters from URI
     */
    private Map<String, String> extractQueryParams(URI uri) {
        Map<String, String> queryPairs = new LinkedHashMap<>();
        if (uri != null && uri.getQuery() != null) {
            String query = uri.getQuery();
            String[] pairs = query.split("&");
            for (String pair : pairs) {
                int idx = pair.indexOf("=");
                queryPairs.put(
                        URLDecoder.decode(pair.substring(0, idx), StandardCharsets.UTF_8),
                        URLDecoder.decode(pair.substring(idx + 1), StandardCharsets.UTF_8)
                );
            }
        }
        return queryPairs;
    }

    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        log.info("Received message from WebSocket client: {}", payload);
        if ("{\"type\":\"PING\"}".equals(payload)) {
            session.sendMessage(new TextMessage("PONG"));
            log.info("Sent PONG to client session {}", session.getId());
            return;
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.error("WebSocket transport error for session {}: {}", session.getId(), exception.getMessage());
    }
}