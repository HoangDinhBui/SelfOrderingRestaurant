package com.example.SelfOrderingRestaurant.Exception;

import org.springframework.http.HttpStatus;

public enum AttendanceError {
    NO_FACE(HttpStatus.BAD_REQUEST, "Không phát hiện khuôn mặt, vui lòng nhìn thẳng vào camera"),
    FACE_MISMATCH(HttpStatus.UNAUTHORIZED, "Khuôn mặt không khớp với hồ sơ nhân viên"),
    SPOOF_DETECTED(HttpStatus.UNAUTHORIZED, "Phát hiện hình ảnh giả mạo"),
    ALREADY_CHECKED_IN(HttpStatus.CONFLICT, "Hôm nay bạn đã check-in"),
    NOT_CHECKED_IN(HttpStatus.CONFLICT, "Bạn chưa check-in hôm nay"),
    ALREADY_CHECKED_OUT(HttpStatus.CONFLICT, "Hôm nay bạn đã check-out"),
    NO_REFERENCE_FACE(HttpStatus.UNPROCESSABLE_ENTITY, "Nhân viên chưa có ảnh khuôn mặt gốc"),
    FACE_SERVICE_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE, "Dịch vụ xác thực khuôn mặt không khả dụng"),
    ALREADY_REVIEWED(HttpStatus.CONFLICT, "Bản ghi này không ở trạng thái chờ duyệt");

    private final HttpStatus status;
    private final String defaultMessage;

    AttendanceError(HttpStatus status, String defaultMessage) {
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
