package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Request.OrderRequestDTO.OrderItemDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.OrderResponseDTO.OrderCartResponseDTO;
import com.example.SelfOrderingRestaurant.Entity.Dish;
import com.example.SelfOrderingRestaurant.Repository.DishRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.context.annotation.SessionScope;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@SessionScope
public class OrderCartService {

    @Autowired
    private DishRepository dishRepository;

    private final Map<Integer, OrderCartResponseDTO.CartItemDTO> cartItems = new HashMap<>();

    public OrderCartResponseDTO addItem(OrderItemDTO orderItemDTO) {
        Dish dish = dishRepository.findById(orderItemDTO.getDishId())
                .orElseThrow(() -> new IllegalArgumentException("Dish not found"));

        // Check if the item already exists in the cart
        if (cartItems.containsKey(orderItemDTO.getDishId())) {
            OrderCartResponseDTO.CartItemDTO existingItem = cartItems.get(orderItemDTO.getDishId());
            existingItem.setQuantity(existingItem.getQuantity() + orderItemDTO.getQuantity());

            // Update notes if provided
            if (orderItemDTO.getNotes() != null && !orderItemDTO.getNotes().isEmpty()) {
                existingItem.setNotes(orderItemDTO.getNotes());
            }
        } else {
            // Add new item to cart
            OrderCartResponseDTO.CartItemDTO newItem = new OrderCartResponseDTO.CartItemDTO(
                    dish.getDishId(),
                    dish.getName(),
                    dish.getImage(),
                    dish.getPrice(),
                    orderItemDTO.getQuantity(),
                    orderItemDTO.getNotes()
            );
            cartItems.put(dish.getDishId(), newItem);
        }

        return getCart();
    }

    public OrderCartResponseDTO getCart() {
        List<OrderCartResponseDTO.CartItemDTO> items = new ArrayList<>(cartItems.values());

        // Calculate total amount
        BigDecimal totalAmount = items.stream()
                .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new OrderCartResponseDTO(items, totalAmount);
    }

    public OrderCartResponseDTO removeItem(Integer dishId) {
        cartItems.remove(dishId);
        return getCart();
    }

    public OrderCartResponseDTO updateItemQuantity(Integer dishId, int quantity) {
        if (!cartItems.containsKey(dishId)) {
            throw new IllegalArgumentException("Item not found in cart");
        }

        if (quantity <= 0) {
            return removeItem(dishId);
        }

        OrderCartResponseDTO.CartItemDTO item = cartItems.get(dishId);
        item.setQuantity(quantity);

        return getCart();
    }

    public void clearCart() {
        cartItems.clear();
    }

    public List<OrderItemDTO> getCartItemsAsOrderItems() {
        return cartItems.values().stream()
                .map(item -> {
                    OrderItemDTO orderItemDTO = new OrderItemDTO();
                    orderItemDTO.setDishId(item.getDishId());
                    orderItemDTO.setQuantity(item.getQuantity());
                    orderItemDTO.setNotes(item.getNotes());
                    orderItemDTO.setDishName(item.getDishName());
                    orderItemDTO.setPrice(item.getPrice());
                    return orderItemDTO;
                })
                .collect(Collectors.toList());
    }
}