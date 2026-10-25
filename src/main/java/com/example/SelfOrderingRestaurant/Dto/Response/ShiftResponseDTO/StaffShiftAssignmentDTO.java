package com.example.SelfOrderingRestaurant.Dto.Response.ShiftResponseDTO;

import com.example.SelfOrderingRestaurant.Enum.StaffShiftStatus;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

/** One staff member on one shift on one day, as shown on the admin schedule. */
@Data
public class StaffShiftAssignmentDTO {
    private Integer staffShiftId;
    private LocalDate date;
    private Integer staffId;
    private String staffName;
    private Integer shiftId;
    private String shiftName;
    private LocalTime startTime;
    private LocalTime endTime;
    private StaffShiftStatus status;
}
