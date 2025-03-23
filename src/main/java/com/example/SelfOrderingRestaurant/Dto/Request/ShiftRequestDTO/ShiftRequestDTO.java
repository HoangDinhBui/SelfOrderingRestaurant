package com.example.SelfOrderingRestaurant.Dto.Request.ShiftRequestDTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalTime;

@AllArgsConstructor
@Getter
@Setter
@NoArgsConstructor
public class ShiftRequestDTO {
    private String name;
    private LocalTime startTime;
    private LocalTime endTime;
}