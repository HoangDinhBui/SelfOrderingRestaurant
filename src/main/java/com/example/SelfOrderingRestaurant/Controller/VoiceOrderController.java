package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Dto.Request.VoiceOrderRequestDTO.VoiceOrderTextRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.VoiceOrderResponseDTO.VoiceOrderResultDTO;
import com.example.SelfOrderingRestaurant.Exception.VoiceOrderError;
import com.example.SelfOrderingRestaurant.Exception.VoiceOrderException;
import com.example.SelfOrderingRestaurant.Service.VoiceOrderService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/** Gọi món bằng giọng nói: trả về danh sách món đề xuất, KHÔNG tự thêm vào giỏ. */
@RestController
@RequestMapping("/api/voice-order")
public class VoiceOrderController {

    private final VoiceOrderService voiceOrderService;

    public VoiceOrderController(VoiceOrderService voiceOrderService) {
        this.voiceOrderService = voiceOrderService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<VoiceOrderResultDTO> fromAudio(@RequestParam("audio") MultipartFile audio) {
        try {
            return ResponseEntity.ok(voiceOrderService.fromAudio(audio.getBytes(), audio.getOriginalFilename()));
        } catch (IOException e) {
            throw new VoiceOrderException(VoiceOrderError.AUDIO_UNREADABLE);
        }
    }

    @PostMapping(value = "/parse", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<VoiceOrderResultDTO> fromText(@Valid @RequestBody VoiceOrderTextRequestDTO request) {
        return ResponseEntity.ok(voiceOrderService.fromText(request.text()));
    }
}
