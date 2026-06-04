package com.example.SelfOrderingRestaurant.Dto.Request.UserRequestDTO;

import com.example.SelfOrderingRestaurant.Enum.UserStatus;
import com.example.SelfOrderingRestaurant.Enum.UserType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class CreateUserRequestDTO {
    private String username;
    private String password;
    private String email;
    private String phone;
    private UserType userType;
    private UserStatus userStatus;
}
