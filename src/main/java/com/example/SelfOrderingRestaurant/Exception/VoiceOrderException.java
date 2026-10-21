package com.example.SelfOrderingRestaurant.Exception;

public class VoiceOrderException extends RuntimeException {
    private final VoiceOrderError error;

    public VoiceOrderException(VoiceOrderError error) {
        super(error.defaultMessage());
        this.error = error;
    }

    public VoiceOrderError getError() {
        return error;
    }
}
