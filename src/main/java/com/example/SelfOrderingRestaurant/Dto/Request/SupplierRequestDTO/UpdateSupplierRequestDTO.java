package com.example.SelfOrderingRestaurant.Dto.Request.SupplierRequestDTO;

import lombok.Data;

@Data
public class UpdateSupplierRequestDTO {
    private String name;
    private String address;
    private String phone;
}
