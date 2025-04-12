package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Request.CategoryRequestDTO.CategoryDTO;
import com.example.SelfOrderingRestaurant.Entity.Category;
import com.example.SelfOrderingRestaurant.Repository.CategoryRepository;
import com.example.SelfOrderingRestaurant.Service.Imp.ICategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class CategoryService implements ICategoryService {
    @Autowired
    private CategoryRepository categoryRepository;

    @Transactional
    @Override
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    @Transactional
    @Override
    public Category getCategoryById(Integer id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
    }

    @Transactional
    @Override
    public void createCategory(CategoryDTO request) {
        if(categoryRepository.findByName(request.getName()).isPresent()) {
            throw new IllegalArgumentException("Category already exists");
        }
        Category category = new Category();
        category.setName(request.getName());
        category.setDescription(request.getDescription());
        category.setImage(request.getImage());
        category.setStatus(request.getStatus());

        categoryRepository.save(category);
    }

    @Transactional
    @Override
    public void updateCategory(Integer id, CategoryDTO request) {
        categoryRepository.findById(id).ifPresent(category -> {
            category.setName(request.getName());
            category.setDescription(request.getDescription());
            category.setImage(request.getImage());
            category.setStatus(request.getStatus());
            categoryRepository.save(category);
        });
    }

    @Transactional
    @Override
    public boolean deleteCategory(Integer id) {
        Optional<Category> category = categoryRepository.findById(id);
        if(category.isPresent()) {
            categoryRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
