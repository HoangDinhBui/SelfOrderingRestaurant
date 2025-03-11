package com.example.SelfOrderingRestaurant.Dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ShiftDTO {
    private Long shiftId;
    private String name;
    private LocalTime startTime;
    private LocalTime endTime;
}