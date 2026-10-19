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
		try {
			nu.pattern.OpenCV.loadShared();
		} catch (Throwable t) {
			System.err.println("Could not load OpenCV native libraries: " + t.getMessage());
		}
	}

	public static void main(String[] args) {
		System.out.println("OpenCV library version: " + Core.VERSION);
		SpringApplication.run(SelfOrderingRestaurantApplication.class, args);
	}

	// The former initAdmin runner created admin/admin on every database (production included).
	// The first admin now comes from BOOTSTRAP_ADMIN_* env vars, see Config.AdminBootstrap.
}
