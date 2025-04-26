package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Dto.Request.InventoryRequestDTO.CreateInventoryRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.InventoryRequestDTO.UpdateInventoryRequestDTO;
import com.example.SelfOrderingRestaurant.Service.InventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.AllArgsConstructor;

@AllArgsConstructor
@RestController
@RequestMapping("/api/admin/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping
    public ResponseEntity<?> getAllInventories() {
        return ResponseEntity.ok(inventoryService.getAllInventories());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getInventoryById(@PathVariable Integer id) {
        return ResponseEntity.ok(inventoryService.getInventoryById(id));
    }

    @PostMapping
    public ResponseEntity<?> createInventory(@RequestBody CreateInventoryRequestDTO request) {
        inventoryService.createInventory(request);
        return ResponseEntity.ok("Inventory created successfully");
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateInventory(@PathVariable Integer id, @RequestBody UpdateInventoryRequestDTO requestDTO) {
        inventoryService.updateInventory(id, requestDTO);
        return ResponseEntity.ok("Inventory updated successfully");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteInventory(@PathVariable Integer id) {
        if(inventoryService.deleteInventory(id)) {
            return ResponseEntity.ok("Inventory deleted");
        }
        return ResponseEntity.notFound().build();
    }
}
