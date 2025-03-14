package com.example.SelfOrderingRestaurant.Dto;

import lombok.Getter;
import lombok.Setter;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Integer userId;
    private String username;
    private String email;
    private String userType;
    private String status;
}


