package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Request.InventoryRequestDTO.CreateInventoryRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.InventoryRequestDTO.UpdateInventoryRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.OrderRequestDTO.UpdateInventoryByOrderRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.InventoryResponseDTO.GetInventoryResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.InventoryResponseDTO.RemainingInventoryResponseDTO;
import com.example.SelfOrderingRestaurant.Entity.*;
import com.example.SelfOrderingRestaurant.Repository.*;
import com.example.SelfOrderingRestaurant.Service.Imp.IInventoryService;
import org.apache.poi.hpsf.Decimal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;

@AllArgsConstructor
@Service
public class InventoryService implements IInventoryService {

    private final InventoryRepository inventoryRepository;

    private final IngredientRepository ingredientRepository;

    private final DishIngredientRepository dishIngredientRepository;

    private final SupplierRepository supplierRepository;

    private final DishRepository dishRepository;

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
        // Find Ingredient by ingredientId
        Ingredient ingredient = ingredientRepository.findById(request.getIngredientId())
                .orElseThrow(() -> new RuntimeException("Ingredient not found"));

        // Check that if ingredient already has supplier, no need to re-query supplier
        if (ingredient.getSupplier() == null) {
            Supplier supplier = supplierRepository.findById(request.getSupplierId())
                    .orElseThrow(() -> new RuntimeException("Supplier not found"));
            ingredient.setSupplier(supplier);  // Update supplier for ingredient
        }

        // Create Inventory Objects and settle values
        Inventory inventory = new Inventory();
        inventory.setIngredient(ingredient);
        inventory.setQuantity(request.getQuantity());
        inventory.setUnit(request.getUnit());


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

    @Transactional
    @Override
    public RemainingInventoryResponseDTO getRemainingInventoryByIngredientId(Integer ingredientId) {
        // Tìm inventory theo ingredientId
        Inventory inventory = inventoryRepository.findByIngredientIngredientId(ingredientId)
                .orElseThrow(() -> new RuntimeException("Inventory not found for ingredient ID: " + ingredientId));

        // Tính tổng số lượng đã sử dụng từ dish_ingredients
        BigDecimal totalUsedQuantity = dishIngredientRepository.getTotalQuantityUsedByIngredientId(ingredientId);
        if (totalUsedQuantity == null) {
            totalUsedQuantity = BigDecimal.ZERO;
        }

        // Tính số lượng còn lại
        Double remainingQuantity = inventory.getQuantity() - totalUsedQuantity.doubleValue();

        // Kiểm tra số lượng còn lại không âm
        if (remainingQuantity < 0) {
            throw new RuntimeException("Remaining quantity cannot be negative for ingredient ID: " + ingredientId);
        }

        // Cập nhật quantity trong inventory
        inventory.setQuantity(remainingQuantity);
        inventory.setLastUpdated(new Date());
        inventoryRepository.save(inventory);

        // Lấy thông tin ingredient
        Ingredient ingredient = inventory.getIngredient();

        // Trả về DTO
        return new RemainingInventoryResponseDTO(
                ingredient.getIngredientId(),
                inventory.getInventoryId(),
                ingredient.getName(),
                ingredient.getSupplier() != null ? ingredient.getSupplier().getName() : "N/A",
                remainingQuantity,
                inventory.getUnit(),
                inventory.getLastUpdated()
        );
    }

    @Transactional
    @Override
    public List<RemainingInventoryResponseDTO> getAllRemainingInventories() {
        List<Inventory> inventories = inventoryRepository.findAll();

        return inventories.stream().map(inventory -> {
            Integer ingredientId = inventory.getIngredient().getIngredientId();
            BigDecimal totalUsedQuantity = dishIngredientRepository.getTotalQuantityUsedByIngredientId(ingredientId);
            if (totalUsedQuantity == null) {
                totalUsedQuantity = BigDecimal.ZERO;
            }
            Double remainingQuantity = inventory.getQuantity() - totalUsedQuantity.doubleValue();

            // Kiểm tra số lượng còn lại không âm
            if (remainingQuantity < 0) {
                throw new RuntimeException("Remaining quantity cannot be negative for ingredient ID: " + ingredientId);
            }

            // Cập nhật quantity trong inventory
            inventory.setQuantity(remainingQuantity);
            inventory.setLastUpdated(new Date());
            inventoryRepository.save(inventory);

            return new RemainingInventoryResponseDTO(
                    inventory.getIngredient().getIngredientId(),
                    inventory.getInventoryId(),
                    inventory.getIngredient().getName(),
                    inventory.getIngredient().getSupplier() != null ? inventory.getIngredient().getSupplier().getName() : "N/A",
                    remainingQuantity,
                    inventory.getUnit(),
                    inventory.getLastUpdated()
            );
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    @Override
    public List<RemainingInventoryResponseDTO> getAvailableInventories() {
        List<Inventory> inventories = inventoryRepository.findAll();

        return inventories.stream().map(inventory -> {
            Integer ingredientId = inventory.getIngredient().getIngredientId();
            BigDecimal totalUsedQuantity = dishIngredientRepository.getTotalQuantityUsedByIngredientId(ingredientId);
            if (totalUsedQuantity == null) {
                totalUsedQuantity = BigDecimal.ZERO;
            }
            Double remainingQuantity = inventory.getQuantity() - totalUsedQuantity.doubleValue();

            // No update database, just return data
            return new RemainingInventoryResponseDTO(
                    inventory.getIngredient().getIngredientId(),
                    inventory.getInventoryId(),
                    inventory.getIngredient().getName(),
                    inventory.getIngredient().getSupplier() != null ? inventory.getIngredient().getSupplier().getName() : "N/A",
                    remainingQuantity,
                    inventory.getUnit(),
                    inventory.getLastUpdated()
            );
        }).collect(Collectors.toList());
    }

    @Transactional
    @Override
    public void updateInventoryByOrder(UpdateInventoryByOrderRequestDTO request) {
        // Map để lưu số lượng nguyên liệu cần trừ (sử dụng BigDecimal cho độ chính xác)
        Map<Integer, BigDecimal> ingredientQuantities = new HashMap<>();

        // Duyệt qua từng món trong order
        for (UpdateInventoryByOrderRequestDTO.OrderItemDTO item : request.getItems()) {
            String dishName = item.getDishName();
            Integer orderQuantity = item.getQuantity();

            // Resolve dishId from dishName
            Dish dish = dishRepository.findByName(dishName)
                    .orElseThrow(() -> new RuntimeException("Dish not found: " + dishName));
            Integer dishId = dish.getDishId();

            List<DishIngredient> dishIngredients = dishIngredientRepository.findByDishId(dishId);
            if (dishIngredients.isEmpty()) {
                throw new RuntimeException("No ingredients found for dish: " + dishName);
            }

            // Tính tổng số lượng nguyên liệu cần trừ cho mỗi món
            for (DishIngredient dishIngredient : dishIngredients) {
                Integer ingredientId = dishIngredient.getIngredient().getIngredientId();
                BigDecimal quantityPerDish = dishIngredient.getQuantity();
                BigDecimal totalQuantity = quantityPerDish.multiply(new BigDecimal(orderQuantity));
                ingredientQuantities.merge(ingredientId, totalQuantity, BigDecimal::add);
            }
        }

        // Cập nhật inventory cho từng nguyên liệu
        for (Map.Entry<Integer, BigDecimal> entry : ingredientQuantities.entrySet()) {
            Integer ingredientId = entry.getKey();
            BigDecimal quantityToDeduct = entry.getValue();

            Inventory inventory = inventoryRepository.findByIngredientIngredientId(ingredientId)
                    .orElseThrow(() -> new RuntimeException("Inventory not found for ingredient ID: " + ingredientId));

            BigDecimal currentQuantity = new BigDecimal(inventory.getQuantity());
            BigDecimal remainingQuantity = currentQuantity.subtract(quantityToDeduct);
            if (remainingQuantity.compareTo(BigDecimal.ZERO) < 0) {
                throw new RuntimeException("Insufficient inventory for ingredient ID: " + ingredientId);
            }

            inventory.setQuantity(remainingQuantity.doubleValue()); // Chuyển sang Double nếu cần
            inventory.setLastUpdated(new Date());
            inventoryRepository.save(inventory);
        }
    }
}
