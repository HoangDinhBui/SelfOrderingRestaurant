package com.example.SelfOrderingRestaurant.Dto.Request.SupplierRequestDTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateSupplierRequestDTO {
    private String name;
    private String address;
    private String phone;
    private String email;
    private String contactPerson;
}
