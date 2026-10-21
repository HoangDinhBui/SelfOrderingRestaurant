package com.example.SelfOrderingRestaurant.Dto.Request.VoiceOrderRequestDTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Câu gọi món dạng chữ (đã chuyển từ giọng nói, hoặc khách gõ tay). */
public record VoiceOrderTextRequestDTO(@NotBlank @Size(max = 500) String text) {
}
