package com.example.SelfOrderingRestaurant.Config;

import com.example.SelfOrderingRestaurant.Entity.*;
import com.example.SelfOrderingRestaurant.Enum.*;
import com.example.SelfOrderingRestaurant.Repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.Date;
import java.util.Optional;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final DishRepository dishRepository;
    private final DinningTableRepository tableRepository;
    private final SupplierRepository supplierRepository;
    private final IngredientRepository ingredientRepository;
    private final InventoryRepository inventoryRepository;
    private final ShiftRepository shiftRepository;

    public DatabaseSeeder(
            CategoryRepository categoryRepository,
            DishRepository dishRepository,
            DinningTableRepository tableRepository,
            SupplierRepository supplierRepository,
            IngredientRepository ingredientRepository,
            InventoryRepository inventoryRepository,
            ShiftRepository shiftRepository) {
        this.categoryRepository = categoryRepository;
        this.dishRepository = dishRepository;
        this.tableRepository = tableRepository;
        this.supplierRepository = supplierRepository;
        this.ingredientRepository = ingredientRepository;
        this.inventoryRepository = inventoryRepository;
        this.shiftRepository = shiftRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        seedTables();
        seedShifts();
        seedCategoriesAndDishes();
        seedSuppliersAndInventory();
    }

    private void seedTables() {
        if (tableRepository.count() == 0) {
            for (int i = 1; i <= 10; i++) {
                DinningTable table = new DinningTable();
                table.setTableNumber(i);
                table.setCapacity(4);
                table.setLocation("Tầng 1");
                table.setTableStatus(TableStatus.AVAILABLE);
                tableRepository.save(table);
            }
            System.out.println("Seeded Tables");
        }
    }

    // Staff self-registration and the admin schedule both need shifts to exist
    private void seedShifts() {
        if (shiftRepository.count() == 0) {
            String[][] defaults = {
                    {"Ca sáng", "07:30", "12:30"},
                    {"Ca chiều", "12:30", "17:30"},
                    {"Ca tối", "17:30", "22:30"},
            };
            for (String[] d : defaults) {
                Shift shift = new Shift();
                shift.setName(d[0]);
                shift.setStartTime(LocalTime.parse(d[1]));
                shift.setEndTime(LocalTime.parse(d[2]));
                shiftRepository.save(shift);
            }
            System.out.println("Seeded Shifts");
        }
    }

    private void seedCategoriesAndDishes() {
        if (categoryRepository.count() == 0) {
            Category mainCourse = new Category();
            mainCourse.setName("Món chính");
            mainCourse.setDescription("Các món ăn chính");
            mainCourse.setStatus(CategoryStatus.ACTIVE);
            categoryRepository.save(mainCourse);

            Category drink = new Category();
            drink.setName("Đồ uống");
            drink.setDescription("Các loại đồ uống");
            drink.setStatus(CategoryStatus.ACTIVE);
            categoryRepository.save(drink);

            Dish dish1 = new Dish();
            dish1.setName("Phở Bò");
            dish1.setPrice(BigDecimal.valueOf(50000));
            dish1.setCategory(mainCourse);
            dish1.setStatus(DishStatus.AVAILABLE);
            dish1.setDescription("Phở bò tái nạm");
            dishRepository.save(dish1);

            Dish dish2 = new Dish();
            dish2.setName("Cà phê sữa đá");
            dish2.setPrice(BigDecimal.valueOf(25000));
            dish2.setCategory(drink);
            dish2.setStatus(DishStatus.AVAILABLE);
            dish2.setDescription("Cà phê truyền thống");
            dishRepository.save(dish2);
            
            System.out.println("Seeded Categories and Dishes");
        }
    }

    private void seedSuppliersAndInventory() {
        if (supplierRepository.count() == 0) {
            Supplier supplier1 = new Supplier();
            supplier1.setName("Nhà cung cấp thịt ABC");
            supplier1.setPhone("0909123456");
            supplier1.setEmail("abc@example.com");
            supplier1.setAddress("Hà Nội");
            supplierRepository.save(supplier1);

            Ingredient ing1 = new Ingredient();
            ing1.setName("Thịt bò");
            ing1.setUnit("kg");
            ing1.setSupplier(supplier1);
            ing1.setStatus(IngredientStatus.AVAILABLE);
            ing1.setCostPerUnit(BigDecimal.valueOf(250000));
            ingredientRepository.save(ing1);

            Inventory inv1 = new Inventory();
            inv1.setIngredient(ing1);
            inv1.setQuantity(50.0);
            inv1.setUnit("kg");
            inv1.setLastUpdated(new Date());
            inventoryRepository.save(inv1);
            
            System.out.println("Seeded Suppliers, Ingredients, and Inventory");
        }
    }
}
