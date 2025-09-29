package com.example.SelfOrderingRestaurant.Service.Imp;

import com.example.SelfOrderingRestaurant.Dto.Request.InventoryRequestDTO.CreateInventoryRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.InventoryRequestDTO.UpdateInventoryRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.InventoryResponseDTO.GetInventoryResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.InventoryResponseDTO.RemainingInventoryResponseDTO;
import com.example.SelfOrderingRestaurant.Entity.Inventory;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface IInventoryService {
    List<GetInventoryResponseDTO> getAllInventories();
    GetInventoryResponseDTO getInventoryById(Integer id);
    void createInventory(CreateInventoryRequestDTO request);
    void updateInventory(Integer id, UpdateInventoryRequestDTO request);
    boolean deleteInventory(Integer id);

    @Transactional
    RemainingInventoryResponseDTO getRemainingInventoryByIngredientId(Integer ingredientId);

    @Transactional
    List<RemainingInventoryResponseDTO> getAllRemainingInventories();

    @Transactional(readOnly = true)
    List<RemainingInventoryResponseDTO> getAvailableInventories();
}