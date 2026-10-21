package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Exception.VoiceOrderError;
import com.example.SelfOrderingRestaurant.Exception.VoiceOrderException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class SpeechToTextClientTest {

    private static final String URL = "http://stt/transcribe";
    private MockRestServiceServer server;
    private SpeechToTextClient client;

    @BeforeEach
    void setUp() {
        RestTemplate restTemplate = new RestTemplate();
        server = MockRestServiceServer.bindTo(restTemplate).build();
        client = new SpeechToTextClient(restTemplate, URL);
    }

    @Test
    void transcribe_returnsTrimmedText() {
        server.expect(requestTo(URL)).andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess("{\"text\":\"  cho hai phở tái \"}", MediaType.APPLICATION_JSON));
        assertEquals("cho hai phở tái", client.transcribe(new byte[]{1}, "voice.webm"));
    }

    @Test
    void transcribe_badRequest_isUnreadableAudio() {
        server.expect(requestTo(URL)).andRespond(withBadRequest()
                .body("{\"error\":\"Cannot decode audio\"}").contentType(MediaType.APPLICATION_JSON));
        VoiceOrderException ex = assertThrows(VoiceOrderException.class,
                () -> client.transcribe(new byte[]{1}, "voice.webm"));
        assertEquals(VoiceOrderError.AUDIO_UNREADABLE, ex.getError());
    }

    @Test
    void transcribe_serverError_isUnavailable() {
        server.expect(requestTo(URL)).andRespond(withServerError());
        VoiceOrderException ex = assertThrows(VoiceOrderException.class,
                () -> client.transcribe(new byte[]{1}, null));
        assertEquals(VoiceOrderError.STT_UNAVAILABLE, ex.getError());
    }

    @Test
    void transcribe_missingTextField_isUnavailable() {
        server.expect(requestTo(URL)).andRespond(withSuccess("{}", MediaType.APPLICATION_JSON));
        VoiceOrderException ex = assertThrows(VoiceOrderException.class,
                () -> client.transcribe(new byte[]{1}, "voice.webm"));
        assertEquals(VoiceOrderError.STT_UNAVAILABLE, ex.getError());
    }
}
