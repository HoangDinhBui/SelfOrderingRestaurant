package com.example.SelfOrderingRestaurant.Dto.Response.ShiftResponseDTO;

import com.example.SelfOrderingRestaurant.Enum.StaffShiftStatus;
import lombok.Data;

import java.time.LocalTime;

@Data
public class ShiftScheduleDTO {
    private Integer staffShiftId;
    private Integer shiftId;
    private String shiftName;
    private LocalTime startTime;
    private LocalTime endTime;
    private StaffShiftStatus status;
}
