package com.example.SelfOrderingRestaurant.Dto.Response.UserResponseDTO;

import lombok.Data;

@Data
public class AuthResponseDto {
    private String accessToken;
    private String refreshToken;
    private String username;
    private String email;
    private String userType;
    private Integer staffId;
}
