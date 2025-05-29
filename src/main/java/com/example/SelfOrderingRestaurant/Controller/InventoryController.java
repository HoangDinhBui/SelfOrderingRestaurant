package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Dto.Request.InventoryRequestDTO.CreateInventoryRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.InventoryRequestDTO.UpdateInventoryRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.InventoryResponseDTO.RemainingInventoryResponseDTO;
import com.example.SelfOrderingRestaurant.Service.InventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.AllArgsConstructor;

import java.util.List;

@AllArgsConstructor
@RestController
@RequestMapping("/api")
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/inventory/available")
    public List<RemainingInventoryResponseDTO> getAvailableInventories() {
        return inventoryService.getAvailableInventories();
    }

    @GetMapping("/inventory")
    public ResponseEntity<?> getAllInventories() {
        return ResponseEntity.ok(inventoryService.getAllInventories());
    }

    @GetMapping("/admin/inventory/{id}")
    public ResponseEntity<?> getInventoryById(@PathVariable Integer id) {
        return ResponseEntity.ok(inventoryService.getInventoryById(id));
    }

    @PostMapping
    public ResponseEntity<?> createInventory(@RequestBody CreateInventoryRequestDTO request) {
        inventoryService.createInventory(request);
        return ResponseEntity.ok("Inventory created successfully");
    }

    @PutMapping("/admin/inventory/{id}")
    public ResponseEntity<?> updateInventory(@PathVariable Integer id, @RequestBody UpdateInventoryRequestDTO requestDTO) {
        inventoryService.updateInventory(id, requestDTO);
        return ResponseEntity.ok("Inventory updated successfully");
    }

    @DeleteMapping("/admin/inventory/{id}")
    public ResponseEntity<?> deleteInventory(@PathVariable Integer id) {
        if(inventoryService.deleteInventory(id)) {
            return ResponseEntity.ok("Inventory deleted");
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/admin/inventory/remaining/{ingredientId}")
    public ResponseEntity<?> getRemainingInventoryByIngredientId(@PathVariable Integer ingredientId) {
        try {
            return ResponseEntity.ok(inventoryService.getRemainingInventoryByIngredientId(ingredientId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/admin/inventory/remaining")
    public ResponseEntity<?> getAllRemainingInventories() {
        return ResponseEntity.ok(inventoryService.getAllRemainingInventories());
    }
}
