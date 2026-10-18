package com.example.SelfOrderingRestaurant.Dto.Response.AttendanceResponseDTO;

import java.time.LocalDateTime;

public record PendingAttendanceDTO(
        Integer attendanceId,
        Integer staffId,
        String staffName,
        LocalDateTime checkInTime,
        LocalDateTime checkOutTime,
        Double workingHours,
        String reason) {
}
