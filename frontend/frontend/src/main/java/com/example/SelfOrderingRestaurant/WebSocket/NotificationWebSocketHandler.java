package com.example.SelfOrderingRestaurant.WebSocket;

import com.example.SelfOrderingRestaurant.Dto.Response.DinningTableResponseDTO.TableTransferNotificationDTO;
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
    // Store customer sessions, mapped to table numbers
    private static final Map<Integer, Set<WebSocketSession>> customerSessions = new ConcurrentHashMap<>();
    @Autowired
    private StaffShiftRepository staffShiftRepository;

    @Autowired
    private ObjectMapper objectMapper; // Tiêm ObjectMapper từ JacksonConfig

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Map<String, String> attributes = extractQueryParams(session.getUri());
        String userType = attributes.get("userType");
        String userIdStr = attributes.get("userId");
        String tableNumberStr = attributes.get("tableNumber");

        log.info("WebSocket connection attempt: userType={}, userId={}, tableNumber={}", userType, userIdStr, tableNumberStr);

        if ("STAFF".equalsIgnoreCase(userType)) {
            if (userIdStr != null) {
                try {
                    Integer userId = Integer.parseInt(userIdStr);
                    staffSessions.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet()).add(session);
                    log.info("Staff user {} connected to notification WebSocket", userId);
                } catch (NumberFormatException e) {
                    log.error("Invalid userId format for STAFF: {}", userIdStr);
                    session.close(CloseStatus.BAD_DATA);
                }
            } else {
                log.error("Missing userId for STAFF connection");
                session.close(CloseStatus.BAD_DATA);
            }
        } else if ("ADMIN".equalsIgnoreCase(userType)) {
            if (userIdStr != null) {
                try {
                    Integer userId = Integer.parseInt(userIdStr);
                    adminSessions.add(session);
                    log.info("Admin user {} connected to notification WebSocket", userId);
                } catch (NumberFormatException e) {
                    log.error("Invalid userId format for ADMIN: {}", userIdStr);
                    session.close(CloseStatus.BAD_DATA);
                }
            } else {
                log.error("Missing userId for ADMIN connection");
                session.close(CloseStatus.BAD_DATA);
            }
        } else if ("CUSTOMER".equalsIgnoreCase(userType)) {
            if (tableNumberStr != null) {
                try {
                    Integer tableNumber = Integer.parseInt(tableNumberStr);
                    customerSessions.computeIfAbsent(tableNumber, k -> ConcurrentHashMap.newKeySet()).add(session);
                    session.getAttributes().put("tableNumber", tableNumber);
                    log.info("Customer connected to notification WebSocket for table {}", tableNumber);
                } catch (NumberFormatException e) {
                    log.error("Invalid tableNumber format for CUSTOMER: {}", tableNumberStr);
                    session.close(CloseStatus.BAD_DATA);
                }
            } else {
                log.error("Missing tableNumber for CUSTOMER connection");
                session.close(CloseStatus.BAD_DATA);
            }
        } else {
            log.error("Invalid userType: {}", userType);
            session.close(CloseStatus.BAD_DATA);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        // Remove session from staff sessions
        for (Map.Entry<Integer, Set<WebSocketSession>> entry : staffSessions.entrySet()) {
            entry.getValue().remove(session);
            if (entry.getValue().isEmpty()) {
                staffSessions.remove(entry.getKey());
            }
        }

        // Remove session from admin sessions
        adminSessions.remove(session);

        // Remove session from customer sessions
        for (Map.Entry<Integer, Set<WebSocketSession>> entry : customerSessions.entrySet()) {
            entry.getValue().remove(session);
            if (entry.getValue().isEmpty()) {
                customerSessions.remove(entry.getKey());
            }
        }

        log.info("WebSocket connection closed for session {}: {}", session.getId(), status);
    }

    public void sendNotificationToUser(Integer userId, NotificationResponseDTO notification) {
        try {
            String jsonNotification = objectMapper.writeValueAsString(notification);
            Set<WebSocketSession> sessions = staffSessions.get(userId);

            if (sessions != null && !sessions.isEmpty()) {
                for (WebSocketSession session : sessions) {
                    if (session.isOpen()) {
                        session.sendMessage(new TextMessage(jsonNotification));
                        log.info("Sent notification to staff user {} session {}: {}", userId, session.getId(), jsonNotification);
                    }
                }
                log.info("Notification sent to staff user {}: {}", userId, notification.getTitle());
            } else {
                log.warn("No active sessions found for staff user {}", userId);
            }
        } catch (IOException e) {
            log.error("Error sending notification to staff user {}: {}", userId, e.getMessage());
        }
    }

    public void sendNotificationToStaff(NotificationResponseDTO notification) {
        try {
            String jsonNotification = notification.toJson(); // Use toJson
            log.info("Broadcasting notification to {} staff sessions: {}", staffSessions.size(), jsonNotification);

            for (Map.Entry<Integer, Set<WebSocketSession>> entry : staffSessions.entrySet()) {
                for (WebSocketSession session : entry.getValue()) {
                    if (session.isOpen()) {
                        session.sendMessage(new TextMessage(jsonNotification));
                        log.info("Sent notification to staff user {} session {}: {}", entry.getKey(), session.getId(), jsonNotification);
                    }
                }
            }

            for (WebSocketSession session : adminSessions) {
                if (session.isOpen()) {
                    session.sendMessage(new TextMessage(jsonNotification));
                    log.info("Sent notification to admin session {}: {}", session.getId(), jsonNotification);
                }
            }

            log.info("Notification broadcast to all active staff: {}", notification.getTitle() != null ? notification.getTitle() : "Custom message");
        } catch (IOException e) {
            log.error("Error broadcasting notification to staff: {}", e.getMessage());
        }
    }

    public void sendTableTransferNotification(TableTransferNotificationDTO notification) {
        try {
            String jsonNotification = objectMapper.writeValueAsString(notification);
            log.info("Broadcasting TABLE_TRANSFERRED notification to {} staff sessions, {} admin sessions, and {} customer sessions for table {}",
                    staffSessions.size(), adminSessions.size(),
                    customerSessions.getOrDefault(notification.getSourceTableId(), ConcurrentHashMap.newKeySet()).size(),
                    notification.getSourceTableId());

            // Send to staff
            for (Map.Entry<Integer, Set<WebSocketSession>> entry : staffSessions.entrySet()) {
                for (WebSocketSession session : entry.getValue()) {
                    if (session.isOpen()) {
                        session.sendMessage(new TextMessage(jsonNotification));
                        log.info("Sent TABLE_TRANSFERRED notification to staff user {} session {}: {}",
                                entry.getKey(), session.getId(), jsonNotification);
                    }
                }
            }

            // Send to admins
            for (WebSocketSession session : adminSessions) {
                if (session.isOpen()) {
                    session.sendMessage(new TextMessage(jsonNotification));
                    log.info("Sent TABLE_TRANSFERRED notification to admin session {}: {}",
                            session.getId(), jsonNotification);
                }
            }

            // Send to customers at the source table
            Set<WebSocketSession> customerSessionSet = customerSessions.get(notification.getSourceTableId());
            if (customerSessionSet != null && !customerSessionSet.isEmpty()) {
                for (WebSocketSession session : customerSessionSet) {
                    if (session.isOpen()) {
                        session.sendMessage(new TextMessage(jsonNotification));
                        log.info("Sent TABLE_TRANSFERRED notification to customer session {} for table {}: {}",
                                session.getId(), notification.getSourceTableId(), jsonNotification);
                    }
                }
            } else {
                log.warn("No active customer sessions found for table {}", notification.getSourceTableId());
            }

            log.info("TABLE_TRANSFERRED notification broadcast to all active staff, admins, and customers for table {}",
                    notification.getSourceTableId());
        } catch (IOException e) {
            log.error("Error broadcasting TABLE_TRANSFERRED notification: {}", e.getMessage());
        }
    }

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