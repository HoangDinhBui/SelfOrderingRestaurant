package com.example.SelfOrderingRestaurant.Dto.Request.StaffRequestDTO;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;

@Data
@AllArgsConstructor
public class AssignStaffRequestDTO {
    @NotNull(message = "Staff ID is required")
    private Integer staffId;

    @NotNull(message = "Shift ID is required")
    private Integer shiftId;

    @NotNull(message = "Date is required")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate date;
}
