package com.example.SelfOrderingRestaurant.Dto.Request.AttendanceRequestDTO;

import com.example.SelfOrderingRestaurant.Entity.Attendance;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ManualAttendanceRequestDTO(
        @NotNull Attendance.AttendanceStatus type,
        @NotBlank @Size(max = 255) String reason) {
}
