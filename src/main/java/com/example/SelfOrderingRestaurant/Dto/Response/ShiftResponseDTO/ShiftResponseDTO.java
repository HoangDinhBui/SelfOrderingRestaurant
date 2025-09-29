package com.example.SelfOrderingRestaurant.Dto.Response.ShiftResponseDTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalTime;

@AllArgsConstructor
@Getter
@Setter
@NoArgsConstructor
public class ShiftResponseDTO {
    private Integer shiftId;
    private String name;
    private LocalTime startTime;
    private LocalTime endTime;
}