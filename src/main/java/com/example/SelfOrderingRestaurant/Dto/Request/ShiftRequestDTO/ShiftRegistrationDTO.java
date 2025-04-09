package com.example.SelfOrderingRestaurant.Dto.Request.ShiftRequestDTO;

import lombok.Data;

import java.time.LocalDate;

@Data
public class ShiftRegistrationDTO {
    private Integer shiftId;
    private LocalDate date;
}
