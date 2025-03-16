package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Dto.DinningTableRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.DinningTableResponseDTO;
import com.example.SelfOrderingRestaurant.Service.DinningTableService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tables")
public class DinningTableController {

    @Autowired
    private DinningTableService dinningTableService;

    // 5.1 Get All Tables
    @GetMapping
    public ResponseEntity<List<DinningTableResponseDTO>> getAllTables() {
        List<DinningTableResponseDTO> tables = dinningTableService.getAllTables();
        return ResponseEntity.ok(tables);
    }

    // 5.2 Update Table Status
    @PutMapping("/{table_id}")
    public ResponseEntity<String> updateTableStatus(
            @PathVariable("table_id") Integer tableId,
            @RequestBody DinningTableRequestDTO dinningTableRequestDTO) {
        dinningTableService.updateTableStatus(tableId, dinningTableRequestDTO.getStatus());
        return ResponseEntity.ok("Table status updated successfully!");
    }
}