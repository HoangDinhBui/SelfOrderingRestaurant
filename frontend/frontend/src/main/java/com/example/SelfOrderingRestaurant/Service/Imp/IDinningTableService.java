package com.example.SelfOrderingRestaurant.Service.Imp;

import com.example.SelfOrderingRestaurant.Dto.Response.DinningTableResponseDTO.DinningTableResponseDTO;
import com.example.SelfOrderingRestaurant.Entity.DinningTable;
import com.example.SelfOrderingRestaurant.Enum.TableStatus;

import java.util.List;

public interface IDinningTableService {
    List<DinningTableResponseDTO> getAllTables();
    void updateTableStatus(Integer tableNumber, TableStatus status);
    DinningTableResponseDTO convertToResponseDTO(DinningTable dinningTable);
}