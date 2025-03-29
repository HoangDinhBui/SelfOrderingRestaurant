package com.example.SelfOrderingRestaurant.Dto.Request.StaffRequestDTO;

import com.example.SelfOrderingRestaurant.Enum.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateStaffDTO {
    private String position;
    private BigDecimal salary;
    private UserStatus status;
}
