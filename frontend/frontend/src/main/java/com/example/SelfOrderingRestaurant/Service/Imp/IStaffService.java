package com.example.SelfOrderingRestaurant.Service.Imp;

import com.example.SelfOrderingRestaurant.Dto.Request.StaffRequestDTO.UpdateStaffDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.StaffResponseDTO.GetAllStaffResponseDTO;

import java.time.LocalDate;
import java.util.List;

public interface IStaffService {
    List<GetAllStaffResponseDTO> getAllStaff();
    GetAllStaffResponseDTO getStaffById(Integer id);
    void assignStaffShift(Integer staffId, Integer shiftId, LocalDate date);
    void updateStaff(Integer id, UpdateStaffDTO staffUpdateDTO);
    void deleteStaff(Integer id);
}