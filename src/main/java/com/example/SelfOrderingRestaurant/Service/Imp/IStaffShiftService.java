package com.example.SelfOrderingRestaurant.Service.Imp;

import com.example.SelfOrderingRestaurant.Dto.Request.ShiftRequestDTO.ShiftRegistrationDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.ShiftResponseDTO.ShiftScheduleDTO;
import com.example.SelfOrderingRestaurant.Entity.Shift;
import com.example.SelfOrderingRestaurant.Entity.Staff;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface IStaffShiftService {
    List<Shift> getAvailableShifts();
    Map<LocalDate, List<ShiftScheduleDTO>> getStaffSchedule(Staff staff);
    Map<LocalDate, List<ShiftScheduleDTO>> getStaffScheduleForDateRange(Staff staff, LocalDate startDate, LocalDate endDate);
    Map<String, Object> registerShifts(Staff staff, List<ShiftRegistrationDTO> registrations);
    void cancelShift(Staff staff, Integer staffShiftId);
    Map<LocalDate, List<ShiftScheduleDTO>> getAvailableShiftsForWeek(LocalDate weekStart);
    Staff getCurrentStaff();
}