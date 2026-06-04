package com.example.SelfOrderingRestaurant.Dto.Response.UserResponseDTO;

import com.example.SelfOrderingRestaurant.Enum.UserStatus;
import com.example.SelfOrderingRestaurant.Enum.UserType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Date;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class UserResponseDTO {
    private Integer userId;
    private String username;
    private String email;
    private String phone;
    private UserType userType;
    private UserStatus userStatus;
    private LocalDateTime createdAt;
    private Date lastLogin;
}
