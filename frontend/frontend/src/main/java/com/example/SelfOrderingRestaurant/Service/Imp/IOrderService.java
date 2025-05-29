package com.example.SelfOrderingRestaurant.Service.Imp;

import com.example.SelfOrderingRestaurant.Dto.Request.OrderRequestDTO.OrderItemDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.OrderRequestDTO.OrderRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.OrderResponseDTO.GetAllOrdersResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.OrderResponseDTO.OrderResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.OrderResponseDTO.OrderCartResponseDTO;

import java.util.List;

public interface IOrderService {
    Integer createOrder(OrderRequestDTO request);
    List<GetAllOrdersResponseDTO> getAllOrders();
    OrderResponseDTO getOrderById(Integer orderId);
    void updateOrderStatus(Integer orderId, String status);
    OrderCartResponseDTO addDishToOrderCart(OrderItemDTO orderItemDTO);
    OrderCartResponseDTO getCurrentOrderCart();
    OrderCartResponseDTO removeItemFromCart(Integer dishId);
    OrderCartResponseDTO updateItemQuantity(Integer dishId, int quantity);
    OrderCartResponseDTO updateItemNotes(Integer dishId, String notes);
    OrderResponseDTO updateOrderItemStatus(Integer orderId, Integer dishId, String status);
}