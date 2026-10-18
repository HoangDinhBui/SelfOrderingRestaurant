package com.example.SelfOrderingRestaurant.Dto.Request.AttendanceRequestDTO;

import jakarta.validation.constraints.NotNull;

public record AttendanceApprovalRequestDTO(@NotNull Boolean approved) {
}
