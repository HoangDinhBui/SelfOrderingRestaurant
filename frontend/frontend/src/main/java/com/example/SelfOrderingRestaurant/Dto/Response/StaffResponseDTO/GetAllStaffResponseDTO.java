package com.example.SelfOrderingRestaurant.Dto.Response.StaffResponseDTO;

import com.example.SelfOrderingRestaurant.Enum.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.apache.poi.hpsf.Decimal;

import java.math.BigDecimal;
import java.util.Date;

@Data
@AllArgsConstructor
public class GetAllStaffResponseDTO {
    private Integer staff_id;
    private String fullname;
    private String role;
    private UserStatus status;
    private String position;
    private String email;
    private String phone;
    private BigDecimal salary;
}
