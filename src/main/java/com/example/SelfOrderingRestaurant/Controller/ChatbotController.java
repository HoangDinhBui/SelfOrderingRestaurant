package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Dto.Request.ChatbotRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.ChatbotResponseDTO;
import com.example.SelfOrderingRestaurant.Service.ChatbotService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chatbot")
public class ChatbotController {

    private final ChatbotService chatbotService;

    public ChatbotController(ChatbotService chatbotService) {
        this.chatbotService = chatbotService;
    }

    @PostMapping("/ask")
    public ResponseEntity<ChatbotResponseDTO> askChatbot(@RequestBody ChatbotRequestDTO request) {
        ChatbotResponseDTO response = chatbotService.askChatbot(request);
        return ResponseEntity.ok(response);
    }
}
