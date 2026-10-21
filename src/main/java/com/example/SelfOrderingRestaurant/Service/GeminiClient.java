package com.example.SelfOrderingRestaurant.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.List;
import java.util.Map;

/** Gọi Gemini và bắt nó trả về JSON đúng theo schema cho trước. */
@Component
public class GeminiClient {

    /** Gemini chưa cấu hình, lỗi mạng, hoặc trả về không đúng định dạng. */
    public static class GeminiUnavailableException extends RuntimeException {
        public GeminiUnavailableException(String message) {
            super(message);
        }
    }

    private static final String API_URL = "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent";
    private static final Duration TIMEOUT = Duration.ofSeconds(30);

    private final RestTemplate restTemplate;
    private final String apiKey;
    private final String model;

    @Autowired
    public GeminiClient(RestTemplateBuilder builder,
                        @Value("${gemini.api-key:}") String apiKey,
                        @Value("${gemini.model:gemini-2.5-flash}") String model) {
        this(builder.connectTimeout(TIMEOUT).readTimeout(TIMEOUT).build(), apiKey, model);
    }

    GeminiClient(RestTemplate restTemplate, String apiKey, String model) {
        this.restTemplate = restTemplate;
        this.apiKey = apiKey;
        this.model = model;
    }

    /** Trả về chuỗi JSON khớp {@code responseSchema} (định dạng OpenAPI-subset của Gemini). */
    public String generateJson(String systemInstruction, String userText, Map<String, Object> responseSchema) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new GeminiUnavailableException("GEMINI_API_KEY is not configured");
        }

        Map<String, Object> payload = Map.of(
                "system_instruction", Map.of("parts", List.of(Map.of("text", systemInstruction))),
                "contents", List.of(Map.of("role", "user", "parts", List.of(Map.of("text", userText)))),
                "generationConfig", Map.of(
                        "temperature", 0,
                        "responseMimeType", "application/json",
                        "responseSchema", responseSchema));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        // Key in a header, not the URL, so it never ends up in access/error logs
        headers.set("x-goog-api-key", apiKey);

        try {
            Map<?, ?> body = restTemplate.postForObject(String.format(API_URL, model),
                    new HttpEntity<>(payload, headers), Map.class);
            return extractText(body);
        } catch (RestClientException e) {
            throw new GeminiUnavailableException("Gemini call failed: " + e.getMessage());
        }
    }

    private static String extractText(Map<?, ?> body) {
        try {
            List<?> candidates = (List<?>) body.get("candidates");
            Map<?, ?> content = (Map<?, ?>) ((Map<?, ?>) candidates.get(0)).get("content");
            List<?> parts = (List<?>) content.get("parts");
            String text = (String) ((Map<?, ?>) parts.get(0)).get("text");
            if (text == null || text.isBlank()) {
                throw new GeminiUnavailableException("Gemini returned an empty answer");
            }
            return text;
        } catch (NullPointerException | ClassCastException | IndexOutOfBoundsException e) {
            // e.g. a safety block returns candidates without content
            throw new GeminiUnavailableException("Unexpected Gemini response shape");
        }
    }
}
