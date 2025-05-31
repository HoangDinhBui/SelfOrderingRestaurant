package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Request.DishRequestDTO.DishRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.DinningTableResponseDTO.DishDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.DishResponseDTO.DishResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.DishResponseDTO.GetAllDishesResponseDTO;
import com.example.SelfOrderingRestaurant.Entity.Category;
import com.example.SelfOrderingRestaurant.Entity.Dish;
import com.example.SelfOrderingRestaurant.Entity.PendingDishUpdate;
import com.example.SelfOrderingRestaurant.Enum.DishStatus;
import com.example.SelfOrderingRestaurant.Exception.ForbiddenException;
import com.example.SelfOrderingRestaurant.Exception.ResourceNotFoundException;
import com.example.SelfOrderingRestaurant.Exception.ValidationException;
import com.example.SelfOrderingRestaurant.Repository.CategoryRepository;
import com.example.SelfOrderingRestaurant.Repository.DishRepository;
import com.example.SelfOrderingRestaurant.Repository.PendingDishUpdateRepository;
import com.example.SelfOrderingRestaurant.Service.Imp.IDishService;
import lombok.AllArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@AllArgsConstructor
@Service
public class DishService implements IDishService {

    private static final Logger logger = LoggerFactory.getLogger(DishService.class);
    private final DishRepository dishRepository;
    private final CategoryRepository categoryRepository;
    private final FileStorageService fileStorageService;
    private static final String DISH_IMAGE_DIR = "dishes";
    private final PendingDishUpdateRepository pendingDishUpdateRepository;

    @Transactional
    @Override
    public void createDish(DishRequestDTO request, Authentication authentication) {
        logger.info("Creating dish with name: {}", request.getName());
        if (!hasAdminRole(authentication)) {
            throw new ForbiddenException("Only administrators can add dishes");
        }

        validateDishRequest(request);

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));

        Dish dish = new Dish();
        dish.setName(request.getName());
        dish.setPrice(request.getPrice());
        dish.setCategory(category);
        dish.setStatus(request.getStatus());
        dish.setDescription(request.getDescription());

        if (request.getImage() != null && !request.getImage().isEmpty()) {
            String imagePath = fileStorageService.saveFile(request.getImage(), DISH_IMAGE_DIR);
            dish.setImage(imagePath);
        }

        dishRepository.save(dish);
    }

    @Transactional
    @Override
    public void updateDish(Integer dishId, DishRequestDTO request, Authentication authentication) {
        logger.info("Cập nhật món ăn với id: {}", dishId);
        if (!hasAdminRole(authentication)) {
            throw new ForbiddenException("Chỉ admin mới được cập nhật món ăn");
        }

        Dish dish = dishRepository.findById(dishId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy món ăn với id: " + dishId));

        validateUpdateDishRequest(request, dish.getName());

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với id: " + request.getCategoryId()));

        LocalTime currentTime = LocalTime.now();
        LocalTime startBusinessHour = LocalTime.of(8, 0);
        LocalTime endBusinessHour = LocalTime.of(22, 0);

        logger.debug("Thời gian hiện tại: {}, Giờ làm việc: {} - {}", currentTime, startBusinessHour, endBusinessHour);

        String imagePath = dish.getImage();
        if (request.getImage() != null && !request.getImage().isEmpty()) {
            try {
                imagePath = fileStorageService.saveFile(request.getImage(), DISH_IMAGE_DIR);
            } catch (RuntimeException e) {
                logger.error("Lỗi khi tải ảnh lên cho món ăn {}: {}", dishId, e.getMessage(), e);
                throw new ValidationException("Lỗi khi tải ảnh lên: " + e.getMessage());
            }
        }

        if (currentTime.isAfter(startBusinessHour.minusSeconds(1)) && currentTime.isBefore(endBusinessHour.plusSeconds(1))) {
            logger.info("Trong giờ làm việc (8h-22h), lưu cập nhật vào pending_dish_updates cho món ăn id: {}", dishId);
            PendingDishUpdate pending = new PendingDishUpdate();
            pending.setDishId(dishId);
            pending.setName(request.getName());
            pending.setPrice(request.getPrice());
            pending.setCategoryId(request.getCategoryId());
            pending.setStatus(request.getStatus().name());
            pending.setDescription(request.getDescription());
            pending.setImage(imagePath);
            pending.setEffectiveDateTime(LocalDate.now().plusDays(1).atStartOfDay());
            pendingDishUpdateRepository.save(pending);
        } else {
            logger.info("Ngoài giờ làm việc, áp dụng cập nhật ngay cho món ăn id: {}", dishId);
            dish.setName(request.getName());
            dish.setPrice(request.getPrice());
            dish.setCategory(category);
            dish.setStatus(request.getStatus());
            dish.setDescription(request.getDescription());
            dish.setImage(imagePath);
            dishRepository.save(dish);

            if (imagePath != null && !imagePath.equals(dish.getImage()) && dish.getImage() != null) {
                fileStorageService.deleteFile(dish.getImage());
            }
        }
    }

    private boolean hasAdminRole(Authentication authentication) {
        if (authentication == null) {
            logger.warn("Authentication is null");
            return false;
        }
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));
    }

    private void validateDishRequest(DishRequestDTO request) {
        List<String> errors = new ArrayList<>();

        if (request.getName() == null || request.getName().isEmpty()) {
            errors.add("Dish name cannot be empty");
        } else if (request.getName().length() > 100) {
            errors.add("Dish name must be between 1 and 100 characters");
        } else if (dishRepository.existsByName(request.getName())) {
            errors.add("Dish name already exists");
        }

        if (request.getPrice() == null || request.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            errors.add("Price must be a positive number");
        }

        if (request.getCategoryId() == null) {
            errors.add("Category ID cannot be null");
        } else if (request.getCategoryId() <= 0) {
            errors.add("Category ID must be a positive integer");
        }

        if (request.getStatus() == null) {
            errors.add("Status cannot be null");
        } else if (!(request.getStatus() == DishStatus.AVAILABLE || request.getStatus() == DishStatus.UNAVAILABLE)) {
            errors.add("Status must be either 'AVAILABLE' or 'UNAVAILABLE'");
        }

        if (!errors.isEmpty()) {
            logger.warn("Validation errors: {}", errors);
            throw new ValidationException(String.join(", ", errors));
        }
    }

    private void validateUpdateDishRequest(DishRequestDTO request, String currentDishName) {
        List<String> errors = new ArrayList<>();

        if (request.getName() == null || request.getName().isEmpty()) {
            errors.add("Dish name cannot be empty");
        } else if (request.getName().length() > 100) {
            errors.add("Dish name must be between 1 and 100 characters");
        } else if (!request.getName().equals(currentDishName) && dishRepository.existsByName(request.getName())) {
            errors.add("Dish name already exists");
        }

        if (request.getPrice() == null || request.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            errors.add("Price must be a positive number");
        }

        if (request.getCategoryId() == null) {
            errors.add("Category ID cannot be null");
        } else if (request.getCategoryId() <= 0) {
            errors.add("Category ID must be a positive integer");
        }

        if (request.getStatus() == null) {
            errors.add("Status cannot be null");
        } else if (!(request.getStatus() == DishStatus.AVAILABLE || request.getStatus() == DishStatus.UNAVAILABLE)) {
            errors.add("Status must be either 'AVAILABLE' or 'UNAVAILABLE'");
        }

        if (!errors.isEmpty()) {
            logger.warn("Validation errors: {}", errors);
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

        if (dish.getImage() != null && !dish.getImage().isEmpty()) {
            fileStorageService.deleteFile(dish.getImage());
        }

        dishRepository.delete(dish);
    }

    @Override
    public DishResponseDTO getDishById(Integer dishId) {
        Dish dish = dishRepository.findById(dishId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy món ăn với id: " + dishId));

        // Check for pending updates
        Optional<PendingDishUpdate> pendingUpdate = pendingDishUpdateRepository.findByDishIdAndEffectiveDateTimeAfter(dishId, LocalDateTime.now());
        DishResponseDTO dishDTO;

        if (pendingUpdate.isPresent()) {
            logger.info("Returning current dish data for id {} as update is pending until {}",
                    dishId, pendingUpdate.get().getEffectiveDateTime());
            dishDTO = new DishResponseDTO();
            dishDTO.setDishId(dish.getDishId());
            dishDTO.setDishName(dish.getName());
            dishDTO.setPrice(dish.getPrice());
            dishDTO.setStatus(dish.getStatus());
            dishDTO.setImageUrl(dish.getImage());
            dishDTO.setDescription(dish.getDescription());
            dishDTO.setCategoryName(dish.getCategory().getName());
        } else {
            dishDTO = new DishResponseDTO();
            dishDTO.setDishId(dish.getDishId());
            dishDTO.setDishName(dish.getName());
            dishDTO.setPrice(dish.getPrice());
            dishDTO.setStatus(dish.getStatus());
            dishDTO.setImageUrl(dish.getImage());
            dishDTO.setDescription(dish.getDescription());
            dishDTO.setCategoryName(dish.getCategory().getName());
        }

        return dishDTO;
    }

    @Scheduled(cron = "0 0 0 * * *") // Chạy lúc 0h hàng ngày
    @Transactional
    public void applyPendingDishUpdates() {
        logger.info("Bắt đầu áp dụng các cập nhật món ăn đang chờ xử lý");
        LocalDateTime now = LocalDateTime.now();
        List<PendingDishUpdate> updates = pendingDishUpdateRepository.findByEffectiveDateTimeBefore(now);

        if (updates.isEmpty()) {
            logger.info("Không có cập nhật món ăn nào đang chờ xử lý");
            return;
        }

        for (PendingDishUpdate update : updates) {
            logger.debug("Xử lý cập nhật cho món ăn id: {}, thời gian hiệu lực: {}",
                    update.getDishId(), update.getEffectiveDateTime());
            Dish dish = dishRepository.findById(update.getDishId()).orElse(null);
            if (dish != null) {
                String oldImage = dish.getImage();
                dish.setName(update.getName());
                dish.setPrice(update.getPrice());
                dish.setCategory(categoryRepository.findById(update.getCategoryId()).orElse(null));
                dish.setStatus(DishStatus.valueOf(update.getStatus()));
                dish.setDescription(update.getDescription());
                dish.setImage(update.getImage());
                dishRepository.save(dish);

                if (oldImage != null && !oldImage.equals(update.getImage())) {
                    try {
                        fileStorageService.deleteFile(oldImage);
                    } catch (RuntimeException e) {
                        logger.error("Lỗi khi xóa ảnh cũ {}: {}", oldImage, e.getMessage());
                    }
                }
                logger.info("Áp dụng cập nhật thành công cho món ăn id: {}", update.getDishId());
            } else {
                logger.warn("Không tìm thấy món ăn với id: {}", update.getDishId());
            }
            pendingDishUpdateRepository.delete(update);
        }
        logger.info("Hoàn thành áp dụng {} cập nhật món ăn", updates.size());
    }
}