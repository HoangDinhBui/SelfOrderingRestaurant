package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.*;
import com.example.SelfOrderingRestaurant.Entity.Category;
import com.example.SelfOrderingRestaurant.Repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Service
public class DishService {
    @Autowired
    private DishRepository dishRepository;
    @Autowired
    private CategoryRepository categoryRepository;

    @Transactional
    public DishResponseDTO createDish(DishRequestDTO request) {
        Category category = categoryRepository.findById(request.ca)
    }
}