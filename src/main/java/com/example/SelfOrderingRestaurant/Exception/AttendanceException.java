package com.example.SelfOrderingRestaurant.Exception;

public class AttendanceException extends RuntimeException {
    private final AttendanceError error;

    public AttendanceException(AttendanceError error) {
        this(error, error.defaultMessage());
    }

    public AttendanceException(AttendanceError error, String message) {
        super(message);
        this.error = error;
    }

    public AttendanceError getError() {
        return error;
    }
}
