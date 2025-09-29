package com.example.SelfOrderingRestaurant.Service.Imp;

import com.example.SelfOrderingRestaurant.Dto.Request.DinningTableRequestDTO.CreateTableRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.DinningTableRequestDTO.UpdateTableRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.DinningTableResponseDTO.DinningTableResponseDTO;
import com.example.SelfOrderingRestaurant.Entity.DinningTable;
import com.example.SelfOrderingRestaurant.Enum.TableStatus;
import jakarta.transaction.Transactional;

import java.util.List;

public interface IDinningTableService {
    List<DinningTableResponseDTO> getAllTables();
    DinningTableResponseDTO getTableById(Integer tableNumber);
    void updateTableStatus(Integer tableNumber, TableStatus status);
    DinningTableResponseDTO convertToResponseDTO(DinningTable dinningTable);
    DinningTableResponseDTO createTable(CreateTableRequestDTO request);
    DinningTableResponseDTO updateTable(Integer tableNumber, UpdateTableRequestDTO request);

    @Transactional
    void swapTables(Integer tableNumberA, Integer tableNumberB);
}