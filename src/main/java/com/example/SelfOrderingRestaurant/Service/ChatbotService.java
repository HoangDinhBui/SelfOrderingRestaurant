package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Request.ChatbotRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.ChatMessageDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.ChatbotResponseDTO;
import com.example.SelfOrderingRestaurant.Entity.Dish;
import com.example.SelfOrderingRestaurant.Enum.DishStatus;
import com.example.SelfOrderingRestaurant.Repository.DishRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ChatbotService {

    private final DishRepository dishRepository;
    private final RestTemplate restTemplate;

    @Value("${gemini.api-key}")
    private String apiKey;

    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=";

    public ChatbotService(DishRepository dishRepository) {
        this.dishRepository = dishRepository;
        this.restTemplate = new RestTemplate();
    }

    public ChatbotResponseDTO askChatbot(ChatbotRequestDTO request) {
        String systemInstruction = buildSystemInstruction();
        Map<String, Object> payload = new HashMap<>();

        Map<String, Object> systemPart = new HashMap<>();
        systemPart.put("text", systemInstruction);
        Map<String, Object> systemInstructionObj = new HashMap<>();
        systemInstructionObj.put("parts", systemPart);
        payload.put("system_instruction", systemInstructionObj);

        List<Map<String, Object>> contents = new ArrayList<>();
        if (request.getHistory() != null) {
            for (ChatMessageDTO msg : request.getHistory()) {
                Map<String, Object> contentItem = new HashMap<>();
                contentItem.put("role", msg.isUser() ? "user" : "model");
                Map<String, Object> part = new HashMap<>();
                part.put("text", msg.getText());
                contentItem.put("parts", List.of(part));
                contents.add(contentItem);
            }
        }
        
        Map<String, Object> currentMessage = new HashMap<>();
        currentMessage.put("role", "user");
        Map<String, Object> currentPart = new HashMap<>();
        currentPart.put("text", request.getMessage());
        currentMessage.put("parts", List.of(currentPart));
        contents.add(currentMessage);

        payload.put("contents", contents);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(GEMINI_API_URL + apiKey, entity, Map.class);
            Map<String, Object> responseBody = response.getBody();
            if (responseBody != null && responseBody.containsKey("candidates")) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseBody.get("candidates");
                if (!candidates.isEmpty()) {
                    Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                    List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                    String replyText = (String) parts.get(0).get("text");
                    return new ChatbotResponseDTO(replyText);
                }
            }
            return new ChatbotResponseDTO("Dạ xin lỗi anh/chị, em đang gặp chút vấn đề xử lý ngôn ngữ. Anh/chị vui lòng hỏi lại giúp em nhé!");
        } catch (Exception e) {
            log.error("Error calling Gemini API: {}", e.getMessage());
            return new ChatbotResponseDTO("Dạ xin lỗi anh/chị, hệ thống đang bận. Anh/chị thông cảm đợi ít phút nhé!");
        }
    }

    private String buildSystemInstruction() {
        List<Dish> availableDishes = dishRepository.findAll().stream()
                .filter(d -> d.getStatus() == DishStatus.AVAILABLE)
                .collect(Collectors.toList());

        StringBuilder menuBuilder = new StringBuilder();
        for (Dish dish : availableDishes) {
            menuBuilder.append("- ").append(dish.getName())
                    .append(" (").append(dish.getPrice().intValue()).append(" VNĐ): ")
                    .append(dish.getDescription() != null ? dish.getDescription() : "").append("\n");
        }

        return "Bạn là nhân viên tư vấn khách hàng thân thiện, chuyên nghiệp của nhà hàng Bon Appetit. " +
                "Phong cách phục vụ: Lịch sự, chu đáo, xưng \"em\" và gọi khách là \"anh/chị\". " +
                "Trả lời ngắn gọn, súc tích, dễ hiểu. Tuyệt đối không dùng markdown in đậm (**) hay in nghiêng trong câu trả lời. " +
                "Dưới đây là thực đơn hiện tại của nhà hàng:\n\n" +
                menuBuilder.toString() + "\n\n" +
                "Dựa vào thực đơn trên để tư vấn món ăn cho khách một cách tự nhiên. Nếu khách hỏi những thông tin bạn không rõ, " +
                "hãy xin lỗi và báo khách có thể gọi nhân viên phục vụ trực tiếp tại bàn.";
    }
}
