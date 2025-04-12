package com.example.SelfOrderingRestaurant.Service.Imp;

import com.example.SelfOrderingRestaurant.Dto.Request.ShiftRequestDTO.ShiftRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.ShiftResponseDTO.ShiftResponseDTO;

import java.util.List;

public interface IShiftService {
    List<ShiftResponseDTO> getAllShifts();
    ShiftResponseDTO getShiftById(Integer id);
    ShiftResponseDTO createShift(ShiftRequestDTO shiftRequestDTO);
    ShiftResponseDTO updateShift(Integer id, ShiftRequestDTO shiftRequestDTO);
    void deleteShift(Integer id);
}