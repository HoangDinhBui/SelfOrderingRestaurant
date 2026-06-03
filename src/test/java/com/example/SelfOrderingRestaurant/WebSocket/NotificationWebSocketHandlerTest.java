package com.example.SelfOrderingRestaurant.WebSocket;

import com.example.SelfOrderingRestaurant.Dto.Response.NotificationResponseDTO.NotificationResponseDTO;
import com.example.SelfOrderingRestaurant.Enum.NotificationType;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.net.URI;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;

public class NotificationWebSocketHandlerTest {

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private NotificationWebSocketHandler handler;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testCustomerNotification() throws Exception {
        // Mock session
        WebSocketSession mockSession = mock(WebSocketSession.class);
        when(mockSession.getId()).thenReturn("session-1");
        when(mockSession.isOpen()).thenReturn(true);
        when(mockSession.getUri()).thenReturn(new URI("ws://localhost/ws?userType=CUSTOMER&tableNumber=5"));
        when(mockSession.getAttributes()).thenReturn(new HashMap<>());

        // Connect customer
        handler.afterConnectionEstablished(mockSession);

        // Prepare notification
        NotificationResponseDTO notification = new NotificationResponseDTO() {
            @Override public Integer getNotificationId() { return 1; }
            @Override public String getTitle() { return "Test"; }
            @Override public String getContent() { return "Order updated"; }
            @Override public Boolean getIsRead() { return false; }
            @Override public NotificationType getType() { return NotificationType.OTHER; }
            @Override public LocalDateTime getCreateAt() { return LocalDateTime.now(); }
            @Override public Integer getTableNumber() { return 5; }
            @Override public Integer getOrderId() { return 100; }
            @Override public String toJson() { return "{\"title\":\"Test\"}"; }
        };

        // Send notification
        handler.sendNotificationToCustomer(5, notification);

        // Verify message was sent
        ArgumentCaptor<TextMessage> messageCaptor = ArgumentCaptor.forClass(TextMessage.class);
        verify(mockSession, times(1)).sendMessage(messageCaptor.capture());
        assertTrue(messageCaptor.getValue().getPayload().contains("Test"));

        // Disconnect
        handler.afterConnectionClosed(mockSession, org.springframework.web.socket.CloseStatus.NORMAL);
    }
}
