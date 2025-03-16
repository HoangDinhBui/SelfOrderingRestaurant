package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.DinningTableRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.DinningTableResponseDTO;
import com.example.SelfOrderingRestaurant.Entity.DinningTable;
import com.example.SelfOrderingRestaurant.Entity.Enum.TableStatus;
import com.example.SelfOrderingRestaurant.Repository.DinningTableRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DinningTableService {

    @Autowired
    private DinningTableRepository dinningTableRepository;

    // 5.1 Get All Tables
    public List<DinningTableResponseDTO> getAllTables() {
        return dinningTableRepository.findAll().stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    // 5.2 Update Table Status
    public void updateTableStatus(Integer tableNumber, TableStatus status) {
        DinningTable table = dinningTableRepository.findById(tableNumber)
                .orElseThrow(() -> new RuntimeException("Table not found"));
        table.setTableStatus(status); // Cập nhật trạng thái của bàn
        dinningTableRepository.save(table); // Lưu thay đổi vào database
    }

    // Chuyển đổi từ Entity sang ResponseDTO
    private DinningTableResponseDTO convertToResponseDTO(DinningTable table) {
        DinningTableResponseDTO responseDTO = new DinningTableResponseDTO();
        responseDTO.setTable_id(table.getTableNumber()); // Sử dụng tableNumber làm table_id
        responseDTO.setCapacity(table.getCapacity());
        responseDTO.setStatus(table.getTableStatus().toString()); // Chuyển enum thành chuỗi
        return responseDTO;
    }
}