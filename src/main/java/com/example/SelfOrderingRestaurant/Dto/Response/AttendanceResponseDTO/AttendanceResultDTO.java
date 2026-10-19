package com.example.SelfOrderingRestaurant.Dto.Response.AttendanceResponseDTO;

import java.time.LocalDateTime;

public record AttendanceResultDTO(
        Integer attendanceId,
        String type,
        String staffName,
        LocalDateTime time,
        ShiftInfoDTO shift,
        boolean late,
        boolean earlyLeave,
        Double workingHours,
        boolean manual,
        String message) {
}
