package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Repository.DishRepository;
import com.example.SelfOrderingRestaurant.Repository.OrderItemRepository;
import com.example.SelfOrderingRestaurant.Repository.OrderRepository;
import org.springframework.stereotype.Service;

@Service
public class OrderService {
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final DishRepository dishRepository;
}
