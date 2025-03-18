package com.example.SelfOrderingRestaurant.Dto.Response.StaffResponseDTO;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class GetAllStaffResponseDTO {
    private Integer staff_id;
    private String fullname;
    private String role;
}
