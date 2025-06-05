package com.example.SelfOrderingRestaurant;

import org.opencv.core.Core;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;

@SpringBootApplication
@EnableWebSecurity
@EnableScheduling
public class SelfOrderingRestaurantApplication {
	static {
		System.loadLibrary(Core.NATIVE_LIBRARY_NAME);
	}

	public static void main(String[] args) {
		System.out.println("OpenCV library version: " + Core.VERSION);
		SpringApplication.run(SelfOrderingRestaurantApplication.class, args);
	}
}
