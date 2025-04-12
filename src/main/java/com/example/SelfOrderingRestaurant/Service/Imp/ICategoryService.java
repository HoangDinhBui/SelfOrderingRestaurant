package com.example.SelfOrderingRestaurant.Service.Imp;

import com.example.SelfOrderingRestaurant.Dto.Request.CategoryRequestDTO.CategoryDTO;
import com.example.SelfOrderingRestaurant.Entity.Category;

import java.util.List;

public interface ICategoryService {
    List<Category> getAllCategories();
    Category getCategoryById(Integer id);
    void createCategory(CategoryDTO request);
    void updateCategory(Integer id, CategoryDTO request);
    boolean deleteCategory(Integer id);
}