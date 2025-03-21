package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Response.DinningTableResponseDTO.DinningTableResponseDTO;
import com.example.SelfOrderingRestaurant.Entity.DinningTable;
import com.example.SelfOrderingRestaurant.Enum.TableStatus;
import com.example.SelfOrderingRestaurant.Repository.DinningTableRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DinningTableService {

    @Autowired
    private DinningTableRepository dinningTableRepository;

    @Transactional
    public List<DinningTableResponseDTO> getAllTables() {
        return dinningTableRepository.findAll().stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateTableStatus(Integer tableNumber, TableStatus status) {
        DinningTable table = dinningTableRepository.findById(tableNumber)
                .orElseThrow(() -> new RuntimeException("Table not found"));
        if (status == null) {
            throw new IllegalArgumentException("Table status cannot be null");
        }
        table.setTableStatus(status);
        dinningTableRepository.save(table);
    }

    @Transactional
    public DinningTableResponseDTO convertToResponseDTO(DinningTable dinningTable) {
        return new DinningTableResponseDTO(
                dinningTable.getTableNumber(),
                dinningTable.getCapacity(),
                dinningTable.getTableStatus() != null ? dinningTable.getTableStatus().toString() : "UNKNOWN"
        );
    }
}