package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Dto.Request.DinningTableRequestDTO.DinningTableRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.DinningTableResponseDTO.CompleteTableResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.DinningTableResponseDTO.DinningTableResponseDTO;
import com.example.SelfOrderingRestaurant.Service.DinningTableService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import lombok.AllArgsConstructor;

@AllArgsConstructor
@RestController
@RequestMapping("/api/staff/tables")
public class DinningTableController {

    private final DinningTableService dinningTableService;

    @GetMapping
    public ResponseEntity<List<DinningTableResponseDTO>> getAllTables() {
        List<DinningTableResponseDTO> tables = dinningTableService.getAllTables();
        return ResponseEntity.ok(tables);
    }

    @GetMapping("/{table_id}")
    public ResponseEntity<DinningTableResponseDTO> getTableById(@PathVariable("table_id") Integer tableId) {
        DinningTableResponseDTO table = dinningTableService.getTableById(tableId);
        return ResponseEntity.ok(table);
    }

    @PutMapping("/{table_id}")
    public ResponseEntity<String> updateTableStatus(
            @PathVariable("table_id") Integer tableId,
            @RequestBody DinningTableRequestDTO dinningTableRequestDTO) {
        dinningTableService.updateTableStatus(tableId, dinningTableRequestDTO.getStatus());
        return ResponseEntity.ok("Table status updated successfully!");
    }
    @PostMapping("/swap")
    public ResponseEntity<String> swapTables(
            @RequestParam Integer tableNumberA,
            @RequestParam Integer tableNumberB) {
        dinningTableService.swapTables(tableNumberA, tableNumberB);
        return ResponseEntity.ok("Tables swapped successfully!");
    }
}