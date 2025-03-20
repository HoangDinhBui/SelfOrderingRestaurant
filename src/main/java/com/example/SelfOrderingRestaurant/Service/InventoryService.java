package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Request.InventoryRequestDTO.CreateInventoryRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.InventoryRequestDTO.UpdateInventoryRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.InventoryResponseDTO.GetInventoryResponseDTO;
import com.example.SelfOrderingRestaurant.Entity.Ingredient;
import com.example.SelfOrderingRestaurant.Entity.Inventory;
import com.example.SelfOrderingRestaurant.Repository.IngredientRepository;
import com.example.SelfOrderingRestaurant.Repository.InventoryRepository;
import com.example.SelfOrderingRestaurant.Repository.SupplierRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class InventoryService {
    @Autowired
    InventoryRepository inventoryRepository;

    @Autowired
    IngredientRepository ingredientRepository;

    @Autowired
    SupplierRepository supplierRepository;

    @Transactional
    public List<GetInventoryResponseDTO> getAllInventories() {
        List<Inventory> inventories = inventoryRepository.findAll();

        return inventories.stream()
                .map(inventory -> new GetInventoryResponseDTO(
                        inventory.getInventoryId(),
                        inventory.getIngredient().getIngredientId(),
                        inventory.getQuantity(),
                        inventory.getUnit(),
                        inventory.getLastUpdated()
                )).collect(Collectors.toList());
    }

    @Transactional
    public GetInventoryResponseDTO getInventoryById(Integer id) {
        Inventory inventory = inventoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inventory not found with ID: " + id));

        return new GetInventoryResponseDTO(
                inventory.getInventoryId(),
                inventory.getIngredient().getIngredientId(),
                inventory.getQuantity(),
                inventory.getUnit(),
                inventory.getLastUpdated()
        );
    }

    @Transactional
    public void createInventory(CreateInventoryRequestDTO request){
        Ingredient ingredient = ingredientRepository.findById(request.getIngredientId())
                .orElseThrow(() -> new RuntimeException("Ingredient not found"));

        Inventory inventory = new Inventory();
        inventory.setIngredient(ingredient);
        inventory.setQuantity(request.getQuantity());
        inventory.setUnit(request.getUnit());

        inventoryRepository.save(inventory);
    }

    @Transactional
    public void updateInventory(Integer id, UpdateInventoryRequestDTO request) {
        Inventory inventory = inventoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inventory not found with ID: " + id));
        inventory.setQuantity(request.getQuantity());
        inventory.setUnit(request.getUnit());
        inventory.setLastUpdated(new Date());
    }

    @Transactional
    public boolean deleteInventory(Integer id) {
        Optional<Inventory> inventory = inventoryRepository.findById(id);
        if(inventory.isPresent()) {
            inventoryRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
