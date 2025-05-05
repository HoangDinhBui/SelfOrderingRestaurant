package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Request.DishRequestDTO.DishRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.DishResponseDTO.DishResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.DishResponseDTO.GetAllDishesResponseDTO;
import com.example.SelfOrderingRestaurant.Entity.Category;
import com.example.SelfOrderingRestaurant.Entity.Dish;
import com.example.SelfOrderingRestaurant.Enum.DishStatus;
import com.example.SelfOrderingRestaurant.Exception.ForbiddenException;
import com.example.SelfOrderingRestaurant.Exception.ResourceNotFoundException;
import com.example.SelfOrderingRestaurant.Exception.ValidationException;
import com.example.SelfOrderingRestaurant.Repository.CategoryRepository;
import com.example.SelfOrderingRestaurant.Repository.DishRepository;
import com.example.SelfOrderingRestaurant.Service.Imp.IDishService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;

@AllArgsConstructor
@Service
public class DishService implements IDishService {

    private final DishRepository dishRepository;

    private final CategoryRepository categoryRepository;

    private final FileStorageService fileStorageService;

    private static final String DISH_IMAGE_DIR = "dishes";

    @Transactional
    @Override
    public void createDish(DishRequestDTO request, Authentication authentication) {
        // Check user authorization
        if (!hasAdminRole(authentication)) {
            throw new ForbiddenException("Only administrators can add dishes");
        }

        // Validate input data
        validateDishRequest(request);

        // Check if category exists
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));

        // Create and save the dish
        Dish dish = new Dish();
        dish.setName(request.getName());
        dish.setPrice(request.getPrice());
        dish.setCategory(category);
        dish.setStatus(request.getStatus());
        dish.setDescription(request.getDescription());

        // Handle file upload
        if (request.getImage() != null && !request.getImage().isEmpty()) {
            String imagePath = fileStorageService.saveFile(request.getImage(), DISH_IMAGE_DIR);
            dish.setImage(imagePath);
        }

        dishRepository.save(dish);
    }

    @Transactional
    @Override
    public void updateDish(Integer dishId, DishRequestDTO request, Authentication authentication) {
        // Kiểm tra quyền admin
        if (!hasAdminRole(authentication)) {
            throw new ForbiddenException("Chỉ admin mới được cập nhật món ăn");
        }

        // Tìm món ăn
        Dish dish = dishRepository.findById(dishId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy món ăn với id: " + dishId));

        // Kiểm tra dữ liệu đầu vào
        validateUpdateDishRequest(request, dish.getName());

        // Kiểm tra danh mục
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với id: " + request.getCategoryId()));

        // Cập nhật các trường
        dish.setName(request.getName());
        dish.setPrice(request.getPrice());
        dish.setCategory(category);
        dish.setStatus(request.getStatus());
        dish.setDescription(request.getDescription());

        // Xử lý upload hình ảnh
        if (request.getImage() != null && !request.getImage().isEmpty()) {
            try {
                // Xóa hình cũ nếu có
                if (dish.getImage() != null && !dish.getImage().isEmpty()) {
                    fileStorageService.deleteFile(dish.getImage());
                }
                String imagePath = fileStorageService.saveFile(request.getImage(), DISH_IMAGE_DIR);
                dish.setImage(imagePath);
            } catch (RuntimeException e) {
                throw new ValidationException("Lỗi khi upload hình ảnh: " + e.getMessage());
            }
        }

        dishRepository.save(dish);
    }

    private boolean hasAdminRole(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));
    }

    private void validateDishRequest(DishRequestDTO request) {
        List<String> errors = new ArrayList<>();

        // Validate name
        if (request.getName() == null || request.getName().isEmpty()) {
            errors.add("Dish name cannot be empty");
            System.out.println("Dish name cannot be empty");
        } else if (request.getName().length() > 100) {
            errors.add("Dish name must be between 1 and 100 characters");
        } else if (dishRepository.existsByName(request.getName())) {
            errors.add("Dish name already exists");
        }

        // Validate price
        if (request.getPrice() == null || request.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            errors.add("Price must be a positive number");
        }

        // Validate category_id
        if (request.getCategoryId() == null || request.getCategoryId() <= 0) {
            errors.add("Category ID must be a positive integer");
        }

        // Validate status
        if (!(request.getStatus() == DishStatus.AVAILABLE || request.getStatus() == DishStatus.UNAVAILABLE)) {
            errors.add("Status must be either 'AVAILABLE' or 'UNAVAILABLE'");
        }

        if (!errors.isEmpty()) {
            throw new ValidationException(String.join(", ", errors));
        }
    }

    private void validateUpdateDishRequest(DishRequestDTO request, String currentDishName) {
        List<String> errors = new ArrayList<>();

        // Validate name
        if (request.getName() == null || request.getName().isEmpty()) {
            errors.add("Dish name cannot be empty");
        } else if (request.getName().length() > 100) {
            errors.add("Dish name must be between 1 and 100 characters");
        } else if (!request.getName().equals(currentDishName) && dishRepository.existsByName(request.getName())) {
            errors.add("Dish name already exists");
        }

        // Validate price
        if (request.getPrice() == null || request.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            errors.add("Price must be a positive number");
        }

        // Validate category_id
        if (request.getCategoryId() == null || request.getCategoryId() <= 0) {
            errors.add("Category ID must be a positive integer");
        }

        // Validate status
        if (!(request.getStatus() == DishStatus.AVAILABLE || request.getStatus() == DishStatus.UNAVAILABLE)) {
            errors.add("Status must be either 'AVAILABLE' or 'UNAVAILABLE'");
        }

        if (!errors.isEmpty()) {
            throw new ValidationException(String.join(", ", errors));
        }
    }

    @Override
    public List<GetAllDishesResponseDTO> getAllDishes() {
        List<Dish> dishes = dishRepository.findAll();
        return dishes.stream()
                .map(this::mapToGetAllDishesResponseDTO)
                .collect(Collectors.toList());
    }

    public DishResponseDTO getDishById(Integer dishId) {
        Dish dish = dishRepository.findById(dishId)
                .orElseThrow(() -> new IllegalArgumentException("Dish not found with id: " + dishId));

        return mapToDishResponseDTO(dish);
    }

    private DishResponseDTO mapToDishResponseDTO(Dish dish) {
        DishResponseDTO response = new DishResponseDTO();
        response.setDishId(dish.getDishId());
        response.setDishName(dish.getName());
        response.setPrice(dish.getPrice());
        response.setStatus(dish.getStatus());
        response.setImageUrl(dish.getImage());
        response.setDescription(dish.getDescription());
        response.setCategoryName(dish.getCategory().getName());
        return response;
    }

    private GetAllDishesResponseDTO mapToGetAllDishesResponseDTO(Dish dish) {
        return new GetAllDishesResponseDTO(
                dish.getDishId(),
                dish.getName(),
                dish.getPrice(),
                dish.getStatus(),
                dish.getImage(),
                dish.getDescription(),
                dish.getCategory().getName()
        );
    }

    @Transactional
    @Override
    public void updateDishStatus(Integer dishId, DishStatus status) {
        Dish dish = dishRepository.findById(Math.toIntExact(dishId))
                .orElseThrow(() -> new IllegalArgumentException("Dish not found"));

        dish.setStatus(status);
        dishRepository.save(dish);
    }

    @Transactional
    @Override
    public void deleteDish(Integer dishId) {
        Dish dish = dishRepository.findById(dishId)
                .orElseThrow(() -> new IllegalArgumentException("Dish not found with id: " + dishId));

        // Delete image file before deleting entity
        if (dish.getImage() != null && !dish.getImage().isEmpty()) {
            fileStorageService.deleteFile(dish.getImage());
        }

        dishRepository.delete(dish);
    }
}