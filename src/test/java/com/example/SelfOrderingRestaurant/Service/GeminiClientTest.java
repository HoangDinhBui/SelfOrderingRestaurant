package com.example.SelfOrderingRestaurant.Service;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class GeminiClientTest {

    private static final String URL =
            "https://generativelanguage.googleapis.com/v1beta/models/test-model:generateContent";
    private static final Map<String, Object> SCHEMA = Map.of("type", "OBJECT");

    private final RestTemplate restTemplate = new RestTemplate();
    private final MockRestServiceServer server = MockRestServiceServer.bindTo(restTemplate).build();

    @Test
    void generateJson_sendsKeyInHeaderAndReturnsText() {
        server.expect(requestTo(URL))
                .andExpect(header("x-goog-api-key", "k"))
                .andExpect(jsonPath("$.generationConfig.responseMimeType").value("application/json"))
                .andRespond(withSuccess(
                        "{\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"{\\\"items\\\":[]}\"}]}}]}",
                        MediaType.APPLICATION_JSON));
        GeminiClient client = new GeminiClient(restTemplate, "k", "test-model");
        assertEquals("{\"items\":[]}", client.generateJson("sys", "user", SCHEMA));
    }

    @Test
    void generateJson_withoutKey_failsWithoutCallingApi() {
        GeminiClient client = new GeminiClient(restTemplate, "", "test-model");
        assertThrows(GeminiClient.GeminiUnavailableException.class,
                () -> client.generateJson("sys", "user", SCHEMA));
        server.verify();
    }

    @Test
    void generateJson_blockedAnswer_isUnavailable() {
        // a safety block returns a candidate with no content
        server.expect(requestTo(URL)).andRespond(withSuccess(
                "{\"candidates\":[{\"finishReason\":\"SAFETY\"}]}", MediaType.APPLICATION_JSON));
        GeminiClient client = new GeminiClient(restTemplate, "k", "test-model");
        assertThrows(GeminiClient.GeminiUnavailableException.class,
                () -> client.generateJson("sys", "user", SCHEMA));
    }

    @Test
    void generateJson_httpError_isUnavailable() {
        server.expect(requestTo(URL)).andRespond(withStatus(org.springframework.http.HttpStatus.TOO_MANY_REQUESTS));
        GeminiClient client = new GeminiClient(restTemplate, "k", "test-model");
        assertThrows(GeminiClient.GeminiUnavailableException.class,
                () -> client.generateJson("sys", "user", SCHEMA));
    }
}
