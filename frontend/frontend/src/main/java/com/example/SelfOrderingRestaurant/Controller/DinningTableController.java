package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Dto.Request.DinningTableRequestDTO.DinningTableRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.DinningTableResponseDTO.CompleteTableResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.DinningTableResponseDTO.DinningTableResponseDTO;
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

    @GetMapping
    public ResponseEntity<List<DinningTableResponseDTO>> getAllTables() {
        List<DinningTableResponseDTO> tables = dinningTableService.getAllTables();
        return ResponseEntity.ok(tables);
    }

//    @GetMapping("/complete")
//    public ResponseEntity<List<CompleteTableResponseDTO>> getTablesWithCompleteInfo() {
//        List<CompleteTableResponseDTO> tables = dinningTableService.getTablesWithCompleteInfo();
//        return ResponseEntity.ok(tables);
//    }

    @PutMapping("/{table_id}")
    public ResponseEntity<String> updateTableStatus(
            @PathVariable("table_id") Integer tableId,
            @RequestBody DinningTableRequestDTO dinningTableRequestDTO) {
        dinningTableService.updateTableStatus(tableId, dinningTableRequestDTO.getStatus());
        return ResponseEntity.ok("Table status updated successfully!");
    }
}