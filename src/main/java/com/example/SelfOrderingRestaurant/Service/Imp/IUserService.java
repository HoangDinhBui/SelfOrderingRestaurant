package com.example.SelfOrderingRestaurant.Service.Imp;

import com.example.SelfOrderingRestaurant.Dto.Request.UserRequestDTO.CreateUserRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.UserRequestDTO.UpdateUserRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.UserResponseDTO.UserResponseDTO;

import java.util.List;

public interface IUserService {
    List<UserResponseDTO> getAllUsers();
    UserResponseDTO getUserById(Integer userId);
    UserResponseDTO createUser(CreateUserRequestDTO request);
    UserResponseDTO updateUser(Integer userId, UpdateUserRequestDTO request);
    void deleteUser(Integer userId);
}
