package com.example.SelfOrderingRestaurant.Dto.Response.StaffResponseDTO;

import com.example.SelfOrderingRestaurant.Enum.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class GetAllStaffResponseDTO {
    private Integer staff_id;
    private String fullname;
    private String role;
    private UserStatus status;
    private String position;
}
