package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Response.VoiceOrderResponseDTO.VoiceOrderResultDTO;
import com.example.SelfOrderingRestaurant.Entity.Dish;
import com.example.SelfOrderingRestaurant.Enum.DishStatus;
import com.example.SelfOrderingRestaurant.Exception.VoiceOrderError;
import com.example.SelfOrderingRestaurant.Exception.VoiceOrderException;
import com.example.SelfOrderingRestaurant.Repository.DishRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Biến câu gọi món của khách (giọng nói hoặc chữ) thành danh sách món đề xuất để khách xác nhận. */
@Slf4j
@Service
public class VoiceOrderService {

    static final int MAX_AUDIO_BYTES = 1024 * 1024;
    static final int MAX_QUANTITY = 20;
    private static final int MAX_NOTES_LENGTH = 200;

    private static final Map<String, Object> RESPONSE_SCHEMA = Map.of(
            "type", "OBJECT",
            "properties", Map.of(
                    "items", Map.of(
                            "type", "ARRAY",
                            "items", Map.of(
                                    "type", "OBJECT",
                                    "properties", Map.of(
                                            "dishId", Map.of("type", "INTEGER"),
                                            "quantity", Map.of("type", "INTEGER"),
                                            "notes", Map.of("type", "STRING")),
                                    "required", List.of("dishId", "quantity"))),
                    "unmatched", Map.of("type", "ARRAY", "items", Map.of("type", "STRING"))),
            "required", List.of("items", "unmatched"));

    private final SpeechToTextClient speechToTextClient;
    private final GeminiClient geminiClient;
    private final DishRepository dishRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public VoiceOrderService(SpeechToTextClient speechToTextClient, GeminiClient geminiClient,
                             DishRepository dishRepository) {
        this.speechToTextClient = speechToTextClient;
        this.geminiClient = geminiClient;
        this.dishRepository = dishRepository;
    }

    public VoiceOrderResultDTO fromAudio(byte[] audio, String filename) {
        if (audio == null || audio.length == 0) {
            throw new VoiceOrderException(VoiceOrderError.AUDIO_EMPTY);
        }
        if (audio.length > MAX_AUDIO_BYTES) {
            throw new VoiceOrderException(VoiceOrderError.AUDIO_TOO_LARGE);
        }
        return fromText(speechToTextClient.transcribe(audio, filename));
    }

    public VoiceOrderResultDTO fromText(String text) {
        String transcript = text == null ? "" : text.trim();
        if (transcript.isEmpty()) {
            // Silence or noise: nothing to ask Gemini about
            return new VoiceOrderResultDTO(transcript, List.of(), List.of());
        }

        Map<Integer, Dish> menu = dishRepository.findAll().stream()
                .filter(d -> d.getStatus() == DishStatus.AVAILABLE)
                .collect(Collectors.toMap(Dish::getDishId, Function.identity(), (a, b) -> a, LinkedHashMap::new));

        String json;
        try {
            json = geminiClient.generateJson(buildInstruction(menu.values()), transcript, RESPONSE_SCHEMA);
        } catch (GeminiClient.GeminiUnavailableException e) {
            log.error("Voice order parsing unavailable: {}", e.getMessage());
            throw new VoiceOrderException(VoiceOrderError.AI_UNAVAILABLE);
        }
        return toResult(transcript, json, menu);
    }

    private VoiceOrderResultDTO toResult(String transcript, String json, Map<Integer, Dish> menu) {
        JsonNode root;
        try {
            root = objectMapper.readTree(json);
        } catch (Exception e) {
            log.error("Gemini returned invalid JSON for a voice order");
            throw new VoiceOrderException(VoiceOrderError.AI_UNAVAILABLE);
        }

        List<VoiceOrderResultDTO.Item> items = new ArrayList<>();
        for (JsonNode node : root.path("items")) {
            // Never trust the model for names or prices: only ids on today's menu survive
            Dish dish = menu.get(node.path("dishId").asInt(-1));
            if (dish == null) {
                continue;
            }
            int quantity = Math.max(1, Math.min(MAX_QUANTITY, node.path("quantity").asInt(1)));
            String notes = node.path("notes").asText("").trim();
            if (notes.length() > MAX_NOTES_LENGTH) {
                notes = notes.substring(0, MAX_NOTES_LENGTH);
            }
            items.add(new VoiceOrderResultDTO.Item(dish.getDishId(), dish.getName(), dish.getPrice(),
                    dish.getImage(), quantity, notes));
        }

        List<String> unmatched = new ArrayList<>();
        for (JsonNode node : root.path("unmatched")) {
            String phrase = node.asText("").trim();
            if (!phrase.isEmpty()) {
                unmatched.add(phrase);
            }
        }
        return new VoiceOrderResultDTO(transcript, items, unmatched);
    }

    private static String buildInstruction(Iterable<Dish> dishes) {
        StringBuilder menu = new StringBuilder();
        for (Dish dish : dishes) {
            menu.append(dish.getDishId()).append(" | ").append(dish.getName());
            if (dish.getDescription() != null && !dish.getDescription().isBlank()) {
                String description = dish.getDescription().strip();
                menu.append(" | ").append(description, 0, Math.min(description.length(), 120));
            }
            menu.append('\n');
        }

        return """
                Bạn là bộ phận nhận món của một nhà hàng. Đầu vào là câu khách nói khi gọi món, \
                đã được chuyển từ giọng nói sang chữ nên có thể sai chính tả, thiếu dấu hoặc nghe nhầm.

                Thực đơn hôm nay (mã | tên | mô tả):
                %s
                Quy tắc:
                - Với mỗi món khách gọi, chọn món gần nghĩa nhất trong thực đơn và trả về đúng mã (dishId) của nó.
                - Số lượng đọc bằng chữ ("hai", "một chục") phải đổi ra số. Không nói số lượng thì là 1.
                - Yêu cầu riêng cho món ("không hành", "ít cay", "để riêng nước") đưa vào notes, viết ngắn gọn. Không có thì để trống.
                - Cùng một món nhưng khác yêu cầu riêng thì tách thành nhiều dòng.
                - Món khách nhắc tới mà thực đơn không có thì đưa nguyên cụm từ khách nói vào unmatched, không đoán bừa.
                - Bỏ qua câu chào hỏi, câu hỏi hay lời nói không phải gọi món.
                """.formatted(menu);
    }
}
