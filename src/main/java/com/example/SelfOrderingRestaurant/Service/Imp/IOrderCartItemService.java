package com.example.SelfOrderingRestaurant.Service.Imp;

import com.example.SelfOrderingRestaurant.Dto.Request.OrderRequestDTO.OrderItemDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.OrderResponseDTO.OrderCartResponseDTO;

import java.util.List;

public interface IOrderCartItemService {
    OrderCartResponseDTO addItem(OrderItemDTO orderItemDTO);

    OrderCartResponseDTO getCart();

    OrderCartResponseDTO removeItem(Integer dishId);

    OrderCartResponseDTO updateItemQuantity(Integer dishId, int quantity);

    OrderCartResponseDTO updateItemNotes(Integer dishId, String notes);

    void clearCart();

    List<OrderItemDTO> getCartItemsAsOrderItems();
}