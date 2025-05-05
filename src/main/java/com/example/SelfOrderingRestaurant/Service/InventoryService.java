package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Request.InventoryRequestDTO.CreateInventoryRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.InventoryRequestDTO.UpdateInventoryRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.InventoryResponseDTO.GetInventoryResponseDTO;
import com.example.SelfOrderingRestaurant.Entity.Ingredient;
import com.example.SelfOrderingRestaurant.Entity.Inventory;
import com.example.SelfOrderingRestaurant.Entity.Supplier;
import com.example.SelfOrderingRestaurant.Repository.IngredientRepository;
import com.example.SelfOrderingRestaurant.Repository.InventoryRepository;
import com.example.SelfOrderingRestaurant.Repository.SupplierRepository;
import com.example.SelfOrderingRestaurant.Service.Imp.IInventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;

@AllArgsConstructor
@Service
public class InventoryService implements IInventoryService {

    private final InventoryRepository inventoryRepository;


    private final IngredientRepository ingredientRepository;


    private final SupplierRepository supplierRepository;

    @Transactional
    @Override
    public List<GetInventoryResponseDTO> getAllInventories() {
        List<Inventory> inventories = inventoryRepository.findAll();

        return inventories.stream()
                .map(inventory -> new GetInventoryResponseDTO(
                        inventory.getInventoryId(),
                        inventory.getIngredient().getIngredientId(),
                        inventory.getQuantity(),
                        inventory.getUnit(),
                        inventory.getLastUpdated(),
                        inventory.getIngredient().getSupplier().getName(),
                        inventory.getIngredient().getName()
                )).collect(Collectors.toList());
    }

    @Transactional
    @Override
    public GetInventoryResponseDTO getInventoryById(Integer id) {
        Inventory inventory = inventoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inventory not found with ID: " + id));

        return new GetInventoryResponseDTO(
                inventory.getInventoryId(),
                inventory.getIngredient().getIngredientId(),
                inventory.getQuantity(),
                inventory.getUnit(),
                inventory.getLastUpdated(),
                inventory.getIngredient().getSupplier().getName(),
                inventory.getIngredient().getName()
        );
    }

    @Transactional
    @Override
    public void createInventory(CreateInventoryRequestDTO request) {
        // Tìm Ingredient theo ingredientId
        Ingredient ingredient = ingredientRepository.findById(request.getIngredientId())
                .orElseThrow(() -> new RuntimeException("Ingredient not found"));

        // Kiểm tra nếu ingredient đã có supplier, không cần truy vấn lại supplier
        if (ingredient.getSupplier() == null) {
            Supplier supplier = supplierRepository.findById(request.getSupplierId())
                    .orElseThrow(() -> new RuntimeException("Supplier not found"));
            ingredient.setSupplier(supplier);  // Cập nhật supplier cho ingredient
        }

        // Tạo đối tượng Inventory và thiết lập các giá trị
        Inventory inventory = new Inventory();
        inventory.setIngredient(ingredient);
        inventory.setQuantity(request.getQuantity());
        inventory.setUnit(request.getUnit());

        // Lưu Inventory vào cơ sở dữ liệu
        inventoryRepository.save(inventory);
    }


    @Transactional
    @Override
    public void updateInventory(Integer id, UpdateInventoryRequestDTO request) {
        Inventory inventory = inventoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inventory not found with ID: " + id));
        inventory.setQuantity(request.getQuantity());
        inventory.setUnit(request.getUnit());
        inventory.setLastUpdated(new Date());
    }

    @Transactional
    @Override
    public boolean deleteInventory(Integer id) {
        Optional<Inventory> inventory = inventoryRepository.findById(id);
        if(inventory.isPresent()) {
            inventoryRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
