package com.example.SelfOrderingRestaurant.Dto.Request.UserRequestDTO;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequestDto {
    @NotBlank(message = "Username or email is required")
    private String login;

    @NotBlank(message = "Password is required")
    private String password;
}
