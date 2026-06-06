package com.example.SelfOrderingRestaurant.Dto.Request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatbotRequestDTO {
    private String message;
    private List<ChatMessageDTO> history;
}
