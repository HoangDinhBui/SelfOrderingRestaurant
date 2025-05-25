package com.example.SelfOrderingRestaurant.Dto.Response.NotificationResponseDTO;

import com.example.SelfOrderingRestaurant.Enum.NotificationType;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;
import java.util.Map;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class NotificationResponseDTO {
    private static final Logger log = LoggerFactory.getLogger(NotificationResponseDTO.class);

    @Autowired
    private ObjectMapper objectMapper;

    private Integer notificationId;
    private String title;
    private String content;
    private Boolean isRead;
    private NotificationType type;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createAt;
    private Integer tableNumber;
    private Integer orderId;
    private Map<String, Object> customPayload;

    public String toJson() {
        try {
            if (customPayload != null) {
                return new ObjectMapper().writeValueAsString(customPayload);
            } else {
                return new ObjectMapper().writeValueAsString(this);
            }
        } catch (Exception e) {
            log.error("Error serializing NotificationResponseDTO: {}", e.getMessage());
            return "{}";
        }
    }
}