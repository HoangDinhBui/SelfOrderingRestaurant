package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Response.VoiceOrderResponseDTO.VoiceOrderResultDTO;
import com.example.SelfOrderingRestaurant.Entity.Dish;
import com.example.SelfOrderingRestaurant.Enum.DishStatus;
import com.example.SelfOrderingRestaurant.Exception.VoiceOrderError;
import com.example.SelfOrderingRestaurant.Exception.VoiceOrderException;
import com.example.SelfOrderingRestaurant.Repository.DishRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class VoiceOrderServiceTest {

    private SpeechToTextClient stt;
    private GeminiClient gemini;
    private VoiceOrderService service;

    @BeforeEach
    void setUp() {
        stt = mock(SpeechToTextClient.class);
        gemini = mock(GeminiClient.class);
        DishRepository dishRepository = mock(DishRepository.class);
        when(dishRepository.findAll()).thenReturn(List.of(
                dish(1, "Phở tái", "45000", DishStatus.AVAILABLE),
                dish(2, "Trà đá", "5000", DishStatus.AVAILABLE),
                dish(3, "Bún chả", "50000", DishStatus.UNAVAILABLE)));
        service = new VoiceOrderService(stt, gemini, dishRepository);
    }

    @Test
    void fromText_mapsItemsUsingMenuNamesAndPrices() {
        when(gemini.generateJson(anyString(), eq("cho hai phở tái, một phở không hành, thêm trà đá"), anyMap()))
                .thenReturn("""
                        {"items":[
                          {"dishId":1,"quantity":2,"notes":""},
                          {"dishId":1,"quantity":1,"notes":"không hành"},
                          {"dishId":2,"quantity":1}
                        ],"unmatched":[]}""");

        VoiceOrderResultDTO r = service.fromText("cho hai phở tái, một phở không hành, thêm trà đá");

        assertEquals(3, r.items().size());
        assertEquals("Phở tái", r.items().get(0).dishName());
        assertEquals(new BigDecimal("45000"), r.items().get(0).price());
        assertEquals(2, r.items().get(0).quantity());
        assertEquals("không hành", r.items().get(1).notes());
        assertEquals("", r.items().get(2).notes());
        assertTrue(r.unmatched().isEmpty());
    }

    @Test
    void fromText_dropsIdsNotOnTodaysMenu() {
        // 3 exists but is unavailable today; 99 was invented by the model
        when(gemini.generateJson(anyString(), anyString(), anyMap()))
                .thenReturn("{\"items\":[{\"dishId\":3,\"quantity\":1},{\"dishId\":99,\"quantity\":1}],"
                        + "\"unmatched\":[\"bún chả\"]}");

        VoiceOrderResultDTO r = service.fromText("một bún chả");

        assertTrue(r.items().isEmpty());
        assertEquals(List.of("bún chả"), r.unmatched());
    }

    @Test
    void fromText_clampsQuantity() {
        when(gemini.generateJson(anyString(), anyString(), anyMap()))
                .thenReturn("{\"items\":[{\"dishId\":1,\"quantity\":500},{\"dishId\":2,\"quantity\":0}],\"unmatched\":[]}");

        VoiceOrderResultDTO r = service.fromText("năm trăm phở");

        assertEquals(VoiceOrderService.MAX_QUANTITY, r.items().get(0).quantity());
        assertEquals(1, r.items().get(1).quantity());
    }

    @Test
    void fromText_blankTranscript_skipsGemini() {
        VoiceOrderResultDTO r = service.fromText("   ");
        assertTrue(r.items().isEmpty());
        verifyNoInteractions(gemini);
    }

    @Test
    void fromText_geminiDown_isAiUnavailable() {
        when(gemini.generateJson(anyString(), anyString(), anyMap()))
                .thenThrow(new GeminiClient.GeminiUnavailableException("down"));
        VoiceOrderException ex = assertThrows(VoiceOrderException.class, () -> service.fromText("phở"));
        assertEquals(VoiceOrderError.AI_UNAVAILABLE, ex.getError());
    }

    @Test
    void fromText_invalidJson_isAiUnavailable() {
        when(gemini.generateJson(anyString(), anyString(), anyMap())).thenReturn("not json");
        VoiceOrderException ex = assertThrows(VoiceOrderException.class, () -> service.fromText("phở"));
        assertEquals(VoiceOrderError.AI_UNAVAILABLE, ex.getError());
    }

    @Test
    void fromAudio_transcribesThenParses() {
        when(stt.transcribe(any(), eq("voice.webm"))).thenReturn("một trà đá");
        when(gemini.generateJson(anyString(), eq("một trà đá"), anyMap()))
                .thenReturn("{\"items\":[{\"dishId\":2,\"quantity\":1}],\"unmatched\":[]}");

        VoiceOrderResultDTO r = service.fromAudio(new byte[]{1, 2}, "voice.webm");

        assertEquals("một trà đá", r.transcript());
        assertEquals("Trà đá", r.items().get(0).dishName());
    }

    @Test
    void fromAudio_rejectsEmptyAndOversizedClips() {
        assertEquals(VoiceOrderError.AUDIO_EMPTY, assertThrows(VoiceOrderException.class,
                () -> service.fromAudio(new byte[0], "voice.webm")).getError());
        assertEquals(VoiceOrderError.AUDIO_TOO_LARGE, assertThrows(VoiceOrderException.class,
                () -> service.fromAudio(new byte[VoiceOrderService.MAX_AUDIO_BYTES + 1], "voice.webm")).getError());
        verifyNoInteractions(stt);
    }

    private static Dish dish(int id, String name, String price, DishStatus status) {
        Dish d = new Dish();
        d.setDishId(id);
        d.setName(name);
        d.setPrice(new BigDecimal(price));
        d.setStatus(status);
        return d;
    }
}
