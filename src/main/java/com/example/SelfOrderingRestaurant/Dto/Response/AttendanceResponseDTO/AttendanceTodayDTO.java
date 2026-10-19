package com.example.SelfOrderingRestaurant.Dto.Response.AttendanceResponseDTO;

public record AttendanceTodayDTO(String status, AttendanceResultDTO attendance, ShiftInfoDTO shift) {
}
