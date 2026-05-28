package com.example.SelfOrderingRestaurant;

import org.opencv.core.Core;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication
@EnableWebSecurity
@EnableScheduling
@EnableTransactionManagement
public class SelfOrderingRestaurantApplication {
	static {
		nu.pattern.OpenCV.loadShared();
	}

	public static void main(String[] args) {
		System.out.println("OpenCV library version: " + Core.VERSION);
		SpringApplication.run(SelfOrderingRestaurantApplication.class, args);
	}

	@org.springframework.context.annotation.Bean
	public org.springframework.boot.CommandLineRunner initAdmin(
			com.example.SelfOrderingRestaurant.Repository.UserRepository userRepository,
			com.example.SelfOrderingRestaurant.Repository.StaffRepository staffRepository,
			org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
		return args -> {
			if (userRepository.findByUsernameOrEmail("admin", "admin").isEmpty()) {
				com.example.SelfOrderingRestaurant.Entity.User admin = new com.example.SelfOrderingRestaurant.Entity.User();
				admin.setUsername("admin");
				admin.setEmail("admin@example.com");
				admin.setPassword(passwordEncoder.encode("admin"));
				admin.setPhone("0123456789");
				admin.setUserType(com.example.SelfOrderingRestaurant.Enum.UserType.ADMIN);
				admin.setUserStatus(com.example.SelfOrderingRestaurant.Enum.UserStatus.ACTIVE);
				admin.setCreatedAt(java.time.LocalDateTime.now());
				admin.setLastLogin(new java.util.Date());
				com.example.SelfOrderingRestaurant.Entity.User savedAdmin = userRepository.save(admin);

				com.example.SelfOrderingRestaurant.Entity.Staff adminStaff = new com.example.SelfOrderingRestaurant.Entity.Staff();
				adminStaff.setUser(savedAdmin);
				adminStaff.setFullname("System Administrator");
				adminStaff.setHireDate(java.time.LocalDate.now());
				adminStaff.setPosition("Administrator");
				adminStaff.setSalary(java.math.BigDecimal.ZERO);
				adminStaff.setStatus(com.example.SelfOrderingRestaurant.Enum.UserStatus.ACTIVE);
				adminStaff.setTotalWorkingHours(0.0);
				staffRepository.save(adminStaff);
				System.out.println("Default admin user created successfully! (username: admin, password: admin)");
			}
		};
	}
}
