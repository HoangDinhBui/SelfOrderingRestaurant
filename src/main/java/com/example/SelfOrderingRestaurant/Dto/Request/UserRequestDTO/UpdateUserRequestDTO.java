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
public class UpdateUserRequestDTO {
    private String email;
    private String phone;
    private UserType userType;
    private UserStatus userStatus;
}
