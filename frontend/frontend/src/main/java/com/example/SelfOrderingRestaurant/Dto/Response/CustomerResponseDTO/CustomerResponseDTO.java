package com.example.SelfOrderingRestaurant.Dto.Response.CustomerResponseDTO;

import lombok.*;

import java.util.Date;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class CustomerResponseDTO {
    private Integer customerId;
    private String fullname;
    private Date joinDate;
    private Integer points;
}
