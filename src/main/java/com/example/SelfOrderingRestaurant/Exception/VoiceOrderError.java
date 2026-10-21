package com.example.SelfOrderingRestaurant.Exception;

import org.springframework.http.HttpStatus;

public enum VoiceOrderError {
    AUDIO_EMPTY(HttpStatus.BAD_REQUEST, "Không nhận được âm thanh, vui lòng thử lại"),
    AUDIO_TOO_LARGE(HttpStatus.PAYLOAD_TOO_LARGE, "Đoạn ghi âm quá dài, vui lòng nói ngắn hơn"),
    AUDIO_UNREADABLE(HttpStatus.BAD_REQUEST, "Không đọc được đoạn ghi âm, vui lòng thử lại"),
    STT_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE, "Dịch vụ nhận giọng nói đang bận, vui lòng thử lại sau"),
    AI_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE, "Trợ lý gọi món đang bận, vui lòng chọn món trên thực đơn");

    private final HttpStatus status;
    private final String defaultMessage;

    VoiceOrderError(HttpStatus status, String defaultMessage) {
        this.status = status;
        this.defaultMessage = defaultMessage;
    }

    public HttpStatus status() {
        return status;
    }

    public String defaultMessage() {
        return defaultMessage;
    }
}
