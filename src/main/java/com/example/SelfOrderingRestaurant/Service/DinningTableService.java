package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Response.DinningTableResponseDTO.DinningTableResponseDTO;
import com.example.SelfOrderingRestaurant.Entity.DinningTable;
import com.example.SelfOrderingRestaurant.Enum.TableStatus;
import com.example.SelfOrderingRestaurant.Repository.DinningTableRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DinningTableService {

    @Autowired
    private DinningTableRepository dinningTableRepository;

    public List<DinningTableResponseDTO> getAllTables() {
        return dinningTableRepository.findAll().stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    public void updateTableStatus(Integer tableNumber, TableStatus status) {
        DinningTable table = dinningTableRepository.findById(tableNumber)
                .orElseThrow(() -> new RuntimeException("Table not found"));
        table.setTableStatus(status);
        dinningTableRepository.save(table);
    }

    private DinningTableResponseDTO convertToResponseDTO(DinningTable table) {
        DinningTableResponseDTO responseDTO = new DinningTableResponseDTO();
        responseDTO.setTable_id(table.getTableNumber());
        responseDTO.setCapacity(table.getCapacity());
        responseDTO.setStatus(table.getTableStatus().toString());
        return responseDTO;
    }
}