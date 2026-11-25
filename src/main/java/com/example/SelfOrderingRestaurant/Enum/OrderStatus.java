package com.example.SelfOrderingRestaurant.Enum;

public enum OrderStatus {
    PENDING,
    PROCESSING,
    COMPLETED,
    CANCELLED,
    SCHEDULED,
    // Lịch hẹn đã được nhà hàng xác nhận, khách chưa đến
    CONFIRMED
}

