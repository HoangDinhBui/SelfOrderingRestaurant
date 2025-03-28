package com.example.SelfOrderingRestaurant;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;

@SpringBootApplication
@EnableWebSecurity
public class SelfOrderingRestaurantApplication {

	public static void main(String[] args) {
		SpringApplication.run(SelfOrderingRestaurantApplication.class, args);
	}

}
